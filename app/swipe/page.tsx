"use client";

import { useEffect, useState } from "react";
import NotamSwiper from "../component/NotamSwiper";

export default function SwipePage() {
  const [utcTime, setUtcTime] = useState("");

  useEffect(() => {
    function updateTime() {
      const now = new Date();
      setUtcTime(now.toISOString().replace("T", " ").slice(0, 19) + " UTC");
    }

    updateTime();
    const interval = setInterval(updateTime, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <main style={{ padding: 20 }}>
      <h3>{utcTime}</h3>

      <NotamSwiper />
    </main>
  );
}