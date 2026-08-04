import Link from "next/link";

import { auth } from "~/server/auth";
import { HydrateClient } from "~/trpc/server";

export default async function Home() {
  const session = await auth();

  return (
    <HydrateClient>
      <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#2e026d] to-[#15162c] text-white">
        <div className="container flex flex-col items-center justify-center gap-8 px-4 py-16">
          <h1 className="text-5xl font-extrabold tracking-tight sm:text-[5rem]">
            Habit <span className="text-[hsl(280,100%,70%)]">Tracker</span>
          </h1>
          <p className="max-w-md text-center text-lg text-white/80">
            Bangun kebiasaan baik. Catat tiap hari. Jaga streak Anda.
          </p>

          <div className="flex flex-col items-center justify-center gap-4">
            {session?.user ? (
              <>
                <p className="text-center text-xl">
                  Halo, <span className="font-semibold">{session.user.email}</span>
                </p>
                <Link
                  href="/dashboard"
                  className="rounded-full bg-white/10 px-10 py-3 font-semibold no-underline transition hover:bg-white/20"
                >
                  Buka Dashboard
                </Link>
                <Link
                  href="/api/auth/signout"
                  className="text-sm text-white/60 underline-offset-4 hover:underline"
                >
                  Logout
                </Link>
              </>
            ) : (
              <div className="flex gap-4">
                <Link
                  href="/login"
                  className="rounded-full bg-white/10 px-8 py-3 font-semibold no-underline transition hover:bg-white/20"
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  className="rounded-full bg-[hsl(280,100%,70%)] px-8 py-3 font-semibold no-underline transition hover:bg-[hsl(280,100%,60%)]"
                >
                  Daftar
                </Link>
              </div>
            )}
          </div>
        </div>
      </main>
    </HydrateClient>
  );
}
