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
    return NextResponse.json({ events: [] });
  }

  // Refresh access token
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
  const accessToken = refreshData.access_token;

  // Get calendar list
  const calRes = await fetch(
    "https://www.googleapis.com/calendar/v3/users/me/calendarList",
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  const calendars = await calRes.json();

  const jetCalendar = calendars.items.find(
    (cal: any) =>
      cal.description &&
      cal.description.includes("JetInsight calendar integration")
  );

  if (!jetCalendar) {
    console.log("JetInsight calendar not found");
    return NextResponse.json({ events: [] });
  }

  console.log("JetInsight calendar detected");

  // Next 24 hours window
  const start = new Date();
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);

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
    console.error("Google API Error:", error);
    return NextResponse.json({ events: [] });
  }

  const dataEvents = await res.json();
  const events = dataEvents.items || [];

  const flightEvents = events.filter((event: any) =>
    event.summary?.includes("Scheduled flight")
  );

  console.log("Tomorrow flights detected:", flightEvents.length);

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

    const { error: airportError } = await supabase.rpc("build_briefing_airports");

    if (airportError) {
      console.error("build_briefing_airports error:", airportError);
    }

  }

  return NextResponse.json({
    events: flightEvents,
  });

}