import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET() {

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
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

  // 🔁 Refresh access token
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

  // STEP 1: get calendar list
  const calRes = await fetch(
    "https://www.googleapis.com/calendar/v3/users/me/calendarList",
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  const calendars = await calRes.json();

  // STEP 2: find JetInsight calendar
  const jetCalendar = calendars.items.find(
    (cal: any) =>
      cal.description &&
      cal.description.includes("JetInsight calendar integration")
  );

  if (!jetCalendar) {
    console.log("JetInsight calendar not found");
    return NextResponse.json({ events: [] });
  }

  console.log("JET INSIGHT CALENDAR:", jetCalendar.id);

  // Pull next 7 days of events
  const start = new Date();
  const end = new Date();
  end.setDate(end.getDate() + 7);

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

  console.log("JET INSIGHT EVENTS COUNT:", dataEvents.items?.length);

  const events = dataEvents.items || [];

  // Store events in Supabase
  for (const event of events) {
    await supabase
      .from("calendar_events")
      .upsert({
        google_event_id: event.id,
        google_email: connection.google_email,
        summary: event.summary || "",
        description: event.description || "",
        start_time: event.start?.dateTime || event.start?.date,
        end_time: event.end?.dateTime || event.end?.date,
        raw: event,
      });
  }

  return NextResponse.json({
    events,
  });
}