import { NextResponse } from "next/server";
import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

export async function GET() {

  const status = {
    openai: false,
    notamify: false,
    supabase: false,
    resend: false
  };

  // OpenAI
  try {

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY!,
    });

    await openai.models.list();

    status.openai = true;

  } catch (err) {

    console.error("OpenAI status check failed", err);

  }

  // Notamify
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

  // Supabase
  try {

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { error } = await supabase
      .from("calendar_connections")
      .select("id")
      .limit(1);

    if (!error) {
      status.supabase = true;
    }

  } catch (err) {

    console.error("Supabase status check failed", err);

  }

  // Resend
  try {

    const resend = new Resend(process.env.RESEND_API_KEY!);

    await resend.domains.list();

    status.resend = true;

  } catch (err) {

    console.error("Resend status check failed", err);

  }

  return NextResponse.json(status);

}