"use client";

import { useEffect, useState } from "react";

export default function Success() {

  const [connection, setConnection] = useState<any>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [status, setStatus] = useState<any>(null);

  useEffect(() => {
    loadStatus();
  }, []);

  async function loadStatus() {

    // STEP 1 — check calendar connection
    const res = await fetch("/api/calendar/status");
    const data = await res.json();

    setConnection(data.connection);

    // STEP 2 — fetch tomorrow flights
    if (data.connection) {

      const eventsRes = await fetch("/api/calendar/tomorrow");
      const eventsData = await eventsRes.json();

      setEvents(eventsData.events || []);
    }

    setLoadingEvents(false);
  }
  useEffect(() => {

  fetch("/api/system/status")
    .then(res => res.json())
    .then(data => setStatus(data));

  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black">

      <main className="max-w-2xl p-12">

        <h1 className="text-3xl font-semibold mb-8">
          Google Calendar Debug
        </h1>

        {/* STEP 1 */}

        <div className="mb-8">

          <h2 className="text-xl font-semibold">
            Step 1 — Calendar Connection
          </h2>

          {!connection && (
            <p className="text-red-500 mt-2">
              Not Connected
            </p>
          )}

          {connection && (
            <div className="mt-2 text-green-600">
              Connected
              <div className="text-sm text-gray-500 mt-1">
                {connection.google_email}
              </div>
            </div>
          )}

        </div>

        {/* STEP 2 */}

        {connection && (
          <div className="mb-8">

            <h2 className="text-xl font-semibold">
              Step 2 — Connection Timestamp
            </h2>

            <p className="text-gray-600 mt-2">
              {new Date(connection.created_at).toLocaleString()}
            </p>

          </div>
        )}

        {/* STEP 3 */}

        <div>

          <h2 className="text-xl font-semibold">
            Step 3 — Tomorrow's Flights
          </h2>

          {loadingEvents && (
            <p className="text-gray-500 mt-2">
              Loading events...
            </p>
          )}

          {!loadingEvents && events.length === 0 && (
            <p className="text-gray-500 mt-2">
              No flights found tomorrow
            </p>
          )}

          {events.length > 0 && (

            <div className="mt-4 space-y-4">

              {events.map((event: any) => (

                <div
                  key={event.id}
                  className="border rounded-lg p-4 bg-white dark:bg-zinc-900"
                >

                  <div className="font-medium">
                    {event.summary}
                  </div>

                  <div className="text-sm text-gray-500">
                    {event.start?.dateTime || event.start?.date}
                  </div>

                </div>

              ))}

            </div>

          )}

        </div>
        
        <div className="mt-10 text-left">

          <h2 className="font-semibold mb-3">
            System Status
          </h2>

          {status ? (

            <div className="space-y-2 text-sm">

              <div>
                OpenAI API: {status.openai ? "✅ Connected" : "❌ Failed"}
              </div>

              <div>
                Notamify API: {status.notamify ? "✅ Connected" : "❌ Failed"}
              </div>

              <div>
                Supabase: {status.supabase ? "✅ Connected" : "❌ Failed"}
              </div>

              <div>
                Resend Email: {status.resend ? "✅ Connected" : "❌ Failed"}
              </div>

            </div>

          ) : (

            <p className="text-gray-500 text-sm">
              Checking APIs...
            </p>

          )}

        </div>

      </main>

    </div>
  );
}