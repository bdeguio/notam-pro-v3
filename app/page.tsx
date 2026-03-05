export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex min-h-screen w-full max-w-3xl flex-col items-center justify-center gap-12 py-32 px-16 bg-white dark:bg-black sm:items-start">

        <div className="flex flex-col gap-4 text-center sm:text-left">
          <h1 className="text-3xl font-semibold tracking-tight text-black dark:text-zinc-50">
            Connect your Google Calendar
          </h1>

          <p className="max-w-md text-lg text-zinc-600 dark:text-zinc-400">
            Sync your flights automatically and receive beautifully formatted
            NOTAM briefings before departure.
          </p>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row">
          <a
            className="flex h-12 items-center justify-center rounded-full bg-black px-6 text-white transition hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
            href="/api/auth/google"
          >
            Connect Google Calendar
          </a>

          <a
            className="flex h-12 items-center justify-center rounded-full border border-black/[.08] px-6 transition hover:bg-black/[.04] dark:border-white/[.145] dark:hover:bg-[#1a1a1a]"
            href="/learn-more"
          >
            Learn More
          </a>
        </div>

      </main>
    </div>
  );
}