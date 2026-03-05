import { createClient } from "@supabase/supabase-js";

export default async function Success() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data } = await supabase
    .from("calendar_connections")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(1);

  const connection = data?.[0];

  if (!connection) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black">
        <main className="max-w-2xl p-16 text-center">
          <h1 className="text-3xl font-semibold text-black dark:text-white">
            Connection Not Found
          </h1>
          <p className="mt-4 text-zinc-600 dark:text-zinc-400">
            No Google Calendar connection exists.
          </p>
        </main>
      </div>
    );
  }

  const lastConnected = new Date(connection.created_at).toLocaleString();
  const tokenExpires = new Date(connection.expires_at).toLocaleString();

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black">
      <main className="max-w-2xl p-16 text-center">
        <h1 className="text-3xl font-semibold text-black dark:text-white">
          Calendar Connected ✅
        </h1>

        <div className="mt-8 space-y-3 text-zinc-700 dark:text-zinc-300">
          <p>
            <strong>Last Connected:</strong> {lastConnected}
          </p>
          <p>
            <strong>Token Expires:</strong> {tokenExpires}
          </p>
        </div>
      </main>
    </div>
  );
}