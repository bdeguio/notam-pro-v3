"use client";

import { useEffect, useState } from "react";

type Notam = {
  id: string;
  airport: string;
  raw_text: string;
  summarized?: string;
  category?: string;
};

export default function NotamSwiper() {
  const [notams, setNotams] = useState<Notam[]>([]);
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);

  const [startX, setStartX] = useState<number | null>(null);
  const [currentX, setCurrentX] = useState<number | null>(null);

  async function loadNotams() {
    const res = await fetch("/api/notams");
    const data = await res.json();
    setNotams(data.notams || []);
  }

  useEffect(() => {
    loadNotams();
  }, []);

  // ✅ ADD THIS
  async function vote(id: string, type: "up" | "down") {
    try {
      await fetch("/api/notams/vote", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id,
          vote: type,
        }),
      });
    } catch (err) {
      console.error("Vote failed:", err);
    }
  }

  function handleTouchStart(e: React.TouchEvent) {
    setStartX(e.touches[0].clientX);
  }

  function handleTouchMove(e: React.TouchEvent) {
    setCurrentX(e.touches[0].clientX);
  }

  function handleTouchEnd() {
    if (startX === null || currentX === null) return;

    const diff = currentX - startX;

    const notam = notams[index];
    if (!notam) return;

    if (diff > 80) {
      // 👉 swipe right = upvote
      setScore((s) => s + 1);
      vote(notam.id, "up"); // ✅ ADDED
      next();
    } else if (diff < -80) {
      // 👉 swipe left = downvote
      setScore((s) => s - 1);
      vote(notam.id, "down"); // ✅ ADDED
      next();
    }

    setStartX(null);
    setCurrentX(null);
  }

  function next() {
    setIndex((prev) => Math.min(prev + 1, notams.length - 1));
  }

  const notam = notams[index];

  if (!notam) return <p>No NOTAMs</p>;

  return (
    <div style={{ marginTop: 20 }}>
      <p>Score: {score}</p>

      <div
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          border: "1px solid black",
          padding: 20,
          minHeight: 300,
          userSelect: "none",
        }}
      >
        <p><b>{notam.category}</b></p>

        <p>{notam.summarized || notam.raw_text}</p>

        <p>{index + 1} / {notams.length}</p>
      </div>

      <p style={{ marginTop: 10 }}>
        ← swipe left (downvote) | swipe right (upvote) →
      </p>
    </div>
  );
}