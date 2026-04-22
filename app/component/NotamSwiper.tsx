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
  const [swiping, setSwiping] = useState(false);

  const [startX, setStartX] = useState<number | null>(null);
  const [currentX, setCurrentX] = useState<number | null>(null);

  const [isLeaving, setIsLeaving] = useState(false);
  const [direction, setDirection] = useState<"left" | "right" | null>(null);

  async function loadNotams() {
    const res = await fetch("/api/notams");
    const data = await res.json();
    setNotams(data.notams || []);
  }

  useEffect(() => {
    loadNotams();
  }, []);

  async function vote(id: string, type: "up" | "down") {
    try {
      await fetch("/api/notams/vote", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id, vote: type }),
      });
    } catch (err) {
      console.error("Vote failed:", err);
    }
  }

  function handleTouchStart(e: React.TouchEvent) {
    if (swiping) return;
    setStartX(e.touches[0].clientX);
  }

  function handleTouchMove(e: React.TouchEvent) {
    setCurrentX(e.touches[0].clientX);
  }

  function handleTouchEnd() {
    if (startX === null || currentX === null || swiping) return;

    const diff = currentX - startX;
    const notam = notams[index];
    if (!notam) return;

    if (diff > 80) {
      // 👉 RIGHT swipe
      setDirection("right");
      setIsLeaving(true);
      vote(notam.id, "up");
    } else if (diff < -80) {
      // 👉 LEFT swipe
      setDirection("left");
      setIsLeaving(true);
      vote(notam.id, "down");
    }

    setStartX(null);
    setCurrentX(null);
  }

  // when animation finishes → move to next card
  useEffect(() => {
    if (isLeaving) {
      const timeout = setTimeout(() => {
        setIndex((prev) => Math.min(prev + 1, notams.length - 1));
        setIsLeaving(false);
        setDirection(null);
        setSwiping(false);
      }, 250);

      return () => clearTimeout(timeout);
    }
  }, [isLeaving, notams.length]);

  const notam = notams[index];
  const nextNotam = notams[index + 1];

  if (!notam) return <p>No NOTAMs</p>;

  // movement
  const dragX =
    startX !== null && currentX !== null ? currentX - startX : 0;

  const translateX = isLeaving
    ? direction === "right"
      ? 500
      : -500
    : dragX;

  const rotate = translateX * 0.05;

  return (
    <div style={{ marginTop: 20, position: "relative" }}>
      
      {/* NEXT CARD (background) */}
      {nextNotam && (
        <div
          style={{
            position: "absolute",
            width: "100%",
            border: "1px solid #ccc",
            padding: 20,
            minHeight: 300,
            top: 0,
            left: 0,
            opacity: 0.5,
            transform: "scale(0.95)",
          }}
        >
          <p><b>{nextNotam.airport}</b></p>
          <p>{nextNotam.summarized || nextNotam.raw_text}</p>
        </div>
      )}

      {/* CURRENT CARD */}
      <div
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          position: "relative",
          border: "1px solid black",
          padding: 20,
          minHeight: 300,
          userSelect: "none",
          background: "white",
          transform: `translateX(${translateX}px) rotate(${rotate}deg)`,
          transition: startX ? "none" : "transform 0.25s ease",
        }}
      >
        <p><b>{notam.airport}</b></p>

        <p>{notam.summarized || notam.raw_text}</p>

        <p>{index + 1} / {notams.length}</p>
      </div>

      <p style={{ marginTop: 10 }}>
        ← swipe left (downvote) | swipe right (upvote) →
      </p>
    </div>
  );
}