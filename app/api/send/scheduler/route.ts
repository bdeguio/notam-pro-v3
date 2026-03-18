import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {

  const base = process.env.NEXT_PUBLIC_BASE_URL;

  await fetch(`${base}/api/calendar/tomorrow`);
  await fetch(`${base}/api/notams`);
  await fetch(`${base}/api/notams/summarize`);
  await fetch(`${base}/api/send-briefing`);

  return NextResponse.json({
    status: "briefing pipeline executed"
  });

}