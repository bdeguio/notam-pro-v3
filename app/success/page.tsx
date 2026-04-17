"use client";

import { useEffect, useState } from "react";

export default function Success() {
  const [connection, setConnection] = useState<any>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [status, setStatus] = useState<any>(null);

  const [briefingAirports, setBriefingAirports] = useState<any[]>([]);
  const [briefingDate, setBriefingDate] = useState<string | null>(null);
  const [loadingBriefingAirports, setLoadingBriefingAirports] = useState(true);

  const [pullingNotams, setPullingNotams] = useState(false);
  const [pullResults, setPullResults] = useState<any>(null);

  const [realizeData, setRealizeData] = useState<any>(null);
  const [loadingRealize, setLoadingRealize] = useState(true);

  const [sendingTest, setSendingTest] = useState(false);
  const [sendResults, setSendResults] = useState<any>(null);

  useEffect(() => {
    loadStatus();
    loadBriefingAirports();
    loadRealize();
  }, []);

  async function loadStatus() {
    const res = await fetch("/api/calendar/status");
    const data = await res.json();

    setConnection(data.connection);

    if (data.connection) {
      const eventsRes = await fetch("/api/calendar/tomorrow");
      const eventsData = await eventsRes.json();

      if (eventsData.connected === false) {
        setConnection(null);
        setEvents([]);
      } else {
        setEvents(eventsData.events || []);
      }
    } else {
      setEvents([]);
    }

    setLoadingEvents(false);
  }

  async function loadBriefingAirports() {
    setLoadingBriefingAirports(true);

    try {
      const res = await fetch("/api/briefing-airports");
      const data = await res.json();

      setBriefingDate(data.briefing_date || null);
      setBriefingAirports(data.airports || []);
    } catch (error) {
      console.error("Failed to load briefing airports", error);
      setBriefingAirports([]);
    }

    setLoadingBriefingAirports(false);
  }

  async function handlePullNotams() {
    setPullingNotams(true);
    setPullResults(null);

    try {
      const res = await fetch("/api/notams/build");
      const data = await res.json();
      setPullResults(data);
      await loadBriefingAirports();
      await loadRealize();
    } catch (error) {
      console.error("Failed to pull NOTAMs", error);
      setPullResults({ error: "Failed to pull NOTAMs" });
    }

    setPullingNotams(false);
  }

  async function loadRealize() {
    setLoadingRealize(true);

    try {
      const res = await fetch("/api/realize");
      const data = await res.json();
      setRealizeData(data);
    } catch (error) {
      console.error("Failed to load realize preview", error);
      setRealizeData({ error: "Failed to load preview" });
    }

    setLoadingRealize(false);
  }

  async function handleTestSend() {
    setSendingTest(true);
    setSendResults(null);

    try {
      const res = await fetch("/api/send/content");
      const data = await res.json();
      setSendResults(data);
    } catch (error) {
      console.error("Failed to send test email", error);
      setSendResults({ error: "Failed to send test email" });
    }

    setSendingTest(false);
  }

  useEffect(() => {
    fetch("/api/system/status")
      .then((res) => res.json())
      .then((data) => setStatus(data));
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black">
      <main className="max-w-2xl p-12 w-full">
        <h1 className="text-3xl font-semibold mb-8">
          Google Calendar Debug
        </h1>

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

        <div className="mb-8">
          <h2 className="text-xl font-semibold">
            Step 3 — Tomorrow&apos;s Flights
          </h2>

          {loadingEvents && (
            <p className="text-gray-500 mt-2">
              Loading events...
            </p>
          )}

          {!loadingEvents && !connection && (
            <p className="text-red-500 mt-2">
              Not Connected
            </p>
          )}

          {!loadingEvents && connection && events.length === 0 && (
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

        <div className="mb-8">
          <h2 className="text-xl font-semibold">
            Step 4 — Briefing Airports
          </h2>

          {briefingDate && (
            <p className="text-sm text-gray-500 mt-2">
              Briefing date: {briefingDate}
            </p>
          )}

          {loadingBriefingAirports && (
            <p className="text-gray-500 mt-2">
              Loading briefing airports...
            </p>
          )}

          {!loadingBriefingAirports && briefingAirports.length === 0 && (
            <p className="text-gray-500 mt-2">
              No briefing airports found
            </p>
          )}

          {briefingAirports.length > 0 && (
            <div className="mt-4 space-y-3">
              {briefingAirports.map((row: any) => (
                <div
                  key={row.id}
                  className="border rounded-lg p-4 bg-white dark:bg-zinc-900"
                >
                  <div className="font-medium">
                    {row.airport}
                  </div>

                  <div className="text-sm text-gray-500 mt-1">
                    {row.briefing_date}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-4 flex gap-3">
            <button
              onClick={loadBriefingAirports}
              className="px-4 py-2 rounded-lg border bg-white dark:bg-zinc-900"
            >
              Refresh
            </button>

            <button
              onClick={handlePullNotams}
              disabled={pullingNotams || briefingAirports.length === 0}
              className="px-4 py-2 rounded-lg bg-black text-white dark:bg-white dark:text-black disabled:opacity-50"
            >
              {pullingNotams ? "Pulling..." : "Pull"}
            </button>
          </div>

          {pullResults && (
            <div className="mt-4 border rounded-lg p-4 bg-white dark:bg-zinc-900">
              <div className="font-medium mb-2">
                Pull Results
              </div>

              {pullResults.message && (
                <div className="text-sm text-gray-600">
                  {pullResults.message}
                </div>
              )}

              {pullResults.error && (
                <div className="text-sm text-red-500">
                  {pullResults.error}
                </div>
              )}

              {pullResults.airports_checked !== undefined && (
                <div className="text-sm text-gray-600 mb-2">
                  Airports checked: {pullResults.airports_checked}
                </div>
              )}

              {pullResults.results?.length > 0 && (
                <div className="space-y-2">
                  {pullResults.results.map((result: any, index: number) => (
                    <div
                      key={`${result.airport}-${index}`}
                      className="text-sm border rounded p-2"
                    >
                      <div className="font-medium">
                        {result.airport}
                      </div>

                      <div className="text-gray-500">
                        {result.stored && "Stored"}
                        {result.skipped && "Skipped"}
                        {result.error && "Error"}
                      </div>

                      {result.detail && (
                        <div className="text-xs text-gray-400 mt-1">
                          {result.detail}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="mb-8">
          <h2 className="text-xl font-semibold">
            Step 5 — Test Send Briefing Email
          </h2>

          {loadingRealize && (
            <p className="text-gray-500 mt-2">
              Loading email preview...
            </p>
          )}

          {!loadingRealize && realizeData?.message && (
            <p className="text-gray-500 mt-2">
              {realizeData.message}
            </p>
          )}

          {!loadingRealize && realizeData?.error && (
            <p className="text-red-500 mt-2">
              {realizeData.error}
            </p>
          )}

          {!loadingRealize &&
            realizeData &&
            !realizeData.message &&
            !realizeData.error && (
              <div className="mt-4 space-y-4">
                {Object.entries(realizeData).map(([email, briefing]: any) => (
                  <div
                    key={email}
                    className="border rounded-lg p-4 bg-white dark:bg-zinc-900"
                  >
                    <div className="font-medium">
                      {email}
                    </div>

                    <div className="mt-3">
                      <div className="text-sm font-medium mb-1">
                        Flights
                      </div>

                      {briefing.flights?.length > 0 ? (
                        <div className="space-y-1 text-sm text-gray-600">
                          {briefing.flights.map((flight: any, index: number) => (
                            <div key={index}>
                              {flight.origin} → {flight.destination} —{" "}
                              {new Date(flight.time).toLocaleString()}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-sm text-gray-500">
                          No flights
                        </div>
                      )}
                    </div>

                    <div className="mt-3">
                      <div className="text-sm font-medium mb-1">
                        Airports
                      </div>

                      <div className="text-sm text-gray-600">
                        {briefing.airports?.join(", ") || "None"}
                      </div>
                    </div>

                    <div className="mt-3">
                      <div className="text-sm font-medium mb-1">
                        Summarized NOTAMs
                      </div>

                      {briefing.notams?.length > 0 ? (
                        <div className="space-y-2">
                          {briefing.notams.map((notam: any, index: number) => (
                            <div
                              key={index}
                              className="text-sm border rounded p-2"
                            >
                              <div className="font-medium">
                                {notam.airport}
                              </div>
                              <div className="text-gray-500">
                                {notam.severity || "GREEN"}
                              </div>
                              <div className="text-gray-600 mt-1">
                                {notam.summary || "No summary"}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-sm text-gray-500">
                          No summarized NOTAMs found
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

          <div className="mt-4 flex gap-3">
            <button
              onClick={loadRealize}
              className="px-4 py-2 rounded-lg border bg-white dark:bg-zinc-900"
            >
              Refresh Preview
            </button>

            <button
              onClick={handleTestSend}
              disabled={sendingTest}
              className="px-4 py-2 rounded-lg bg-black text-white dark:bg-white dark:text-black disabled:opacity-50"
            >
              {sendingTest ? "Sending..." : "Test Send"}
            </button>
          </div>

          {sendResults && (
            <div className="mt-4 border rounded-lg p-4 bg-white dark:bg-zinc-900">
              <div className="font-medium mb-2">
                Send Results
              </div>

              {sendResults.message && (
                <div className="text-sm text-gray-600 mb-2">
                  {sendResults.message}
                </div>
              )}

              {sendResults.error && (
                <div className="text-sm text-red-500 mb-2">
                  {sendResults.error}
                </div>
              )}

              {sendResults.pilotsProcessed !== undefined && (
                <div className="text-sm text-gray-600 mb-2">
                  Pilots processed: {sendResults.pilotsProcessed}
                </div>
              )}

              {sendResults.results?.length > 0 && (
                <div className="space-y-2">
                  {sendResults.results.map((result: any, index: number) => (
                    <div
                      key={`${result.pilot}-${index}`}
                      className="text-sm border rounded p-2"
                    >
                      <div className="font-medium">
                        {result.pilot}
                      </div>

                      <div className="text-gray-500">
                        {result.emailSent
                          ? "Email sent"
                          : result.skipped
                          ? `Skipped: ${result.skipped}`
                          : "Failed"}
                      </div>

                      {result.airports?.length > 0 && (
                        <div className="text-xs text-gray-400 mt-1">
                          Airports: {result.airports.join(", ")}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
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
                OpenAI API: {status.openai ? "Connected" : "Failed"}
              </div>

              <div>
                Notamify API: {status.notamify ? "Connected" : "Failed"}
              </div>

              <div>
                Supabase: {status.supabase ? "Connected" : "Failed"}
              </div>

              <div>
                Resend Email: {status.resend ? "Connected" : "Failed"}
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