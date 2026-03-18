import { NextResponse } from "next/server";
import OpenAI from "openai";

export async function GET() {

  const status = {
    openai: false,
    notamify: false
  };

  // Check OpenAI
  try {

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY!,
    });

    await openai.models.list();

    status.openai = true;

  } catch (err) {

    console.error("OpenAI status check failed", err);

  }

  // Check Notamify
  try {

    const res = await fetch(
      "https://api.notamify.com/api/v2/notams?locations=KPHX",
      {
        headers: {
          Authorization: `Bearer ${process.env.NOTAMIFY_API_KEY}`
        }
      }
    );

    if (res.ok) {
      status.notamify = true;
    }

  } catch (err) {

    console.error("Notamify status check failed", err);

  }

  return NextResponse.json(status);

}