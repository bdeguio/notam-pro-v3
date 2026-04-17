"use client";

import { useEffect, useState } from "react";

type Notam = {
  id: string;
  airport: string;
  raw_text: string;
  effective_start: string | null;
  effective_end: string | null;
};

export default function NotamSwiper() {
  const [notams, setNotams] = useState<Notam[]>([]);
  const [index, setIndex] = useState(0);

  async function loadNotams() {
    const res = await fetch("/api/notams"); // you'll create this next
    const data = await res.json();
    setNotams(data.notams || []);
  }

  useEffect(() => {
    loadNotams();
  }, []);

  function next() {
    setIndex((prev) => Math.min(prev + 1, notams.length - 1));
  }

  function prev() {
    setIndex((prev) => Math.max(prev - 1, 0));
  }

  const notam = notams[index];

  if (!notam) return <p>No NOTAMs</p>;

  return (
    <div style={{ marginTop: 20 }}>
      <div
        style={{
          border: "1px solid black",
          padding: 20,
          minHeight: 300,
        }}
      >
        <p><b>{notam.airport}</b></p>

        <p>{notam.raw_text}</p>

        <p>
          Start: {notam.effective_start || "N/A"}
          <br />
          End: {notam.effective_end || "N/A"}
        </p>

        <p>
          {index + 1} / {notams.length}
        </p>
      </div>

      <div style={{ marginTop: 10 }}>
        <button onClick={prev}>←</button>
        <button onClick={next} style={{ marginLeft: 10 }}>
          →
        </button>
      </div>
    </div>
  );
}