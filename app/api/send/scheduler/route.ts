import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: Request) {

  const base = new URL(req.url).origin;

  await fetch(`${base}/api/calendar/tomorrow`);
  await fetch(`${base}/api/notams/build`);
  await fetch(`${base}/api/notams/summarize`);
  await fetch(`${base}/api/content`);

  return NextResponse.json({
    status: "successfull"
  });

}