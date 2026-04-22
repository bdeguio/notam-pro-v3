import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  const { id, vote } = await req.json();

  if (!id || !vote) {
    return NextResponse.json({ error: "Missing id or vote" }, { status: 400 });
  }

  const column = vote === "up" ? "upvotes" : "downvotes";

  // increment vote
  const { error } = await supabase.rpc("increment_vote", {
    row_id: id,
    column_name: column,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}