import Link from "next/link";
import { redirect } from "next/navigation";

import { getServerAuthSession } from "~/server/auth";
import { HydrateClient } from "~/trpc/server";
import { HabitManager } from "./_components/HabitManager";

export default async function AdminHabitsPage() {
  const session = await getServerAuthSession();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <HydrateClient>
      <main className="container mx-auto py-10 px-4">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Admin — Kelola Habits</h1>
            <p className="text-sm text-gray-600 mt-1">
              Logged in sebagai{" "}
              <span className="font-semibold">{session.user.email}</span>
            </p>
          </div>
          <Link
            href="/dashboard"
            className="text-sm text-blue-600 hover:underline"
          >
            ← Kembali ke Dashboard
          </Link>
        </div>

        <HabitManager />
      </main>
    </HydrateClient>
  );
}
