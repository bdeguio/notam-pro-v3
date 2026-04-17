"use client";

import { useEffect, useState } from "react";

type AirportRow = {
  id: string;
  airport: string;
  created_at: string;
};

export default function BriefingAirportsBox() {
  const [input, setInput] = useState("");
  const [airports, setAirports] = useState<AirportRow[]>([]);
  const [message, setMessage] = useState("");

  async function loadAirports() {
    const res = await fetch("/api/briefing-airports");
    const data = await res.json();
    setAirports(data.airports || []);
  }

  useEffect(() => {
    loadAirports();
  }, []);

  async function submitAirports() {
    const res = await fetch("/api/briefing-airports", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ input }),
    });

    const data = await res.json();

    if (res.ok) {
      setMessage("Airports added.");
      setInput("");
      loadAirports();
    } else {
      setMessage(data.error || "Error.");
    }
  }

  async function clearTable() {
    const res = await fetch("/api/briefing-airports", {
      method: "DELETE",
    });

    const data = await res.json();

    if (res.ok) {
      setMessage("Table cleared.");
      loadAirports();
    } else {
      setMessage(data.error || "Error.");
    }
  }

  return (
    <div>
      <h2>Briefing Airports</h2>
      <p>Type ICAO identifiers separated by spaces or commas.</p>

      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="KPHX KABQ KSVC"
      />

      <div style={{ marginTop: "10px" }}>
        <button onClick={submitAirports}>Add Airports</button>
        <button onClick={clearTable} style={{ marginLeft: "10px" }}>
          Clear Table
        </button>
      </div>

      <p>{message}</p>

      <ul>
        {airports.map((row) => (
          <li key={row.id}>{row.airport}</li>
        ))}
      </ul>
    </div>
  );
}