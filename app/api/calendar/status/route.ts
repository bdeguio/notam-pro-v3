import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET() {

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data } = await supabase
    .from("calendar_connections")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(1);

  const connection = data?.[0] || null;

  return NextResponse.json({
    connection
  });

}