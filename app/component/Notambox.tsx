"use client";

import { useState } from "react";

export default function NotamBox() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function pullNotams() {
    setLoading(true);
    setMessage("");

    const res = await fetch("/api/notams/build", {
      method: "POST",
    });

    const data = await res.json();

    if (!res.ok) {
      setMessage(data.error || "Failed to pull NOTAMs.");
    } else {
      setMessage(
        `Pulled ${data.totalInserted ?? 0} NOTAM(s) for ${data.airportCount ?? 0} airport(s).`
      );
    }

    setLoading(false);
  }

  return (
    <div>
      <h2>NOTAMs</h2>
      <p>Pull current NOTAMs for all airports in briefing_airports.</p>

      <button onClick={pullNotams} disabled={loading}>
        {loading ? "Pulling..." : "Pull NOTAMs"}
      </button>

      <p>{message}</p>
    </div>
  );
}