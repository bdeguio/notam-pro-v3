import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function parseRoute(summary: string) {
  const match =
    summary.match(/\((\w{3})\s-\s(\w{3})\)/) ||
    summary.match(/(\w{3})-(\w{3})/);

  if (!match) return { origin: null, destination: null };

  return {
    origin: "K" + match[1],
    destination: "K" + match[2],
  };
}

function getTomorrowDateString() {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);

  const year = tomorrow.getFullYear();
  const month = String(tomorrow.getMonth() + 1).padStart(2, "0");
  const day = String(tomorrow.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data } = await supabase
    .from("calendar_connections")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(1);

  const connection = data?.[0];

  if (!connection) {
    return NextResponse.json({
      connected: false,
      events: [],
      message: "Not connected",
    });
  }

  const refreshRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      refresh_token: connection.refresh_token,
      grant_type: "refresh_token",
    }),
  });

  const refreshData = await refreshRes.json();

  if (!refreshRes.ok || !refreshData.access_token) {
    console.error("Google refresh failed:", refreshData);

    return NextResponse.json({
      connected: false,
      events: [],
      message: "Not connected",
    });
  }

  const accessToken = refreshData.access_token;

  const calRes = await fetch(
    "https://www.googleapis.com/calendar/v3/users/me/calendarList",
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  const calendars = await calRes.json();

  if (!calRes.ok || !Array.isArray(calendars.items)) {
    console.error("Google calendar list failed:", calendars);

    return NextResponse.json({
      connected: false,
      events: [],
      message: "Not connected",
    });
  }

  const jetCalendar = calendars.items.find(
    (cal: any) =>
      cal.description &&
      cal.description.includes("JetInsight calendar integration")
  );

  if (!jetCalendar) {
    console.log("JetInsight calendar not found");

    return NextResponse.json({
      connected: true,
      events: [],
      message: "JetInsight calendar not found",
    });
  }

  const start = new Date();
  start.setDate(start.getDate() + 1);
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setHours(23, 59, 59, 999);

  const res = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(
      jetCalendar.id
    )}/events?timeMin=${start.toISOString()}&timeMax=${end.toISOString()}&singleEvents=true&orderBy=startTime`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!res.ok) {
    const error = await res.text();
    console.error("Google events API error:", error);

    return NextResponse.json({
      connected: false,
      events: [],
      message: "Not connected",
    });
  }

  const dataEvents = await res.json();
  const events = dataEvents.items || [];

  const flightEvents = events.filter((event: any) =>
    event.summary?.includes("Scheduled flight")
  );

  const rows = flightEvents.map((event: any) => {
    const { origin, destination } = parseRoute(event.summary || "");

    return {
      google_event_id: event.id,
      google_email: connection.google_email,
      summary: event.summary || "",
      description: event.description || "",
      origin,
      destination,
      start_time: event.start?.dateTime || event.start?.date,
      end_time: event.end?.dateTime || event.end?.date,
      raw: event,
    };
  });

  if (rows.length > 0) {
    const { error: insertError } = await supabase
      .from("calendar_events")
      .upsert(rows);

    if (insertError) {
      console.error("calendar_events insert error:", insertError);
    }
  }

  const briefingDate = getTomorrowDateString();

  const { error: deleteError } = await supabase
    .from("briefing_airports")
    .delete()
    .eq("briefing_date", briefingDate);

  if (deleteError) {
    console.error("briefing_airports delete error:", deleteError);
  }

  const airportSet = new Set<string>();

  for (const row of rows) {
    if (row.origin) airportSet.add(row.origin);
    if (row.destination) airportSet.add(row.destination);
  }

  const airportRows = Array.from(airportSet).map((airport) => ({
    airport,
    briefing_date: briefingDate,
  }));

  if (airportRows.length > 0) {
    const { error: briefingInsertError } = await supabase
      .from("briefing_airports")
      .insert(airportRows);

    if (briefingInsertError) {
      console.error("briefing_airports insert error:", briefingInsertError);
    }
  }

  return NextResponse.json({
    connected: true,
    events: flightEvents,
    parsed_airports: Array.from(airportSet),
    briefing_date: briefingDate,
  });
}