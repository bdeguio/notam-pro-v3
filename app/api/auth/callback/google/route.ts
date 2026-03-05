import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");

  if (!code) {
    console.log("No code returned from Google");
    return NextResponse.redirect(new URL("/", request.url));
  }

  try {
    // Exchange authorization code for tokens
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        redirect_uri: process.env.GOOGLE_REDIRECT_URI!,
        grant_type: "authorization_code",
      }),
    });

    const tokens = await tokenRes.json();

    console.log("TOKENS:", tokens);

    if (!tokens.refresh_token) {
      console.log("No refresh token received");
      return NextResponse.redirect(new URL("/", request.url));
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { error } = await supabase.from("calendar_connections").insert({
      provider: "google",
      refresh_token: tokens.refresh_token,
      access_token: tokens.access_token,
      expires_at: Date.now() + tokens.expires_in * 1000,
    });

    if (error) {
      console.log("Supabase insert error:", error);
      return NextResponse.redirect(new URL("/", request.url));
    }

    return NextResponse.redirect(
      new URL("https://legendary-giggle-x49qprgw764hvrjq-3000.app.github.dev/success")
    );

  } catch (err) {
    console.log("OAuth error:", err);
    return NextResponse.redirect(new URL("/", request.url));
  }
}