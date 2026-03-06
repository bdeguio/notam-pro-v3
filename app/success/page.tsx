"use client";

import { useState } from "react";

export default function Success() {

  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  async function pullCalendar() {
    setLoading(true);

    const res = await fetch("/api/calendar/tomorrow");
    const data = await res.json();

    setEvents(data.events);
    setLoading(false);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black">
      <main className="max-w-2xl p-16 text-center">

        <h1 className="text-3xl font-semibold">
          Calendar Connected ✅
        </h1>

        <button
          onClick={pullCalendar}
          className="mt-8 rounded-full bg-black text-white px-6 py-3"
        >
          {loading ? "Pulling..." : "Pull Calendar"}
        </button>

        <div className="mt-10 text-left">

          {events.length === 0 && !loading && (
            <p>No events loaded yet.</p>
          )}

          {events.map((event) => {

            const start = new Date(
              event.start?.dateTime || event.start?.date
            ).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit"
            });

            return (
              <div key={event.id} className="border-b py-2">
                {start} — {event.summary || "Untitled Event"}
              </div>
            );
          })}

        </div>

      </main>
    </div>
  );
}