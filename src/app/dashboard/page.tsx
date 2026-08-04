import { getServerAuthSession } from "~/server/auth";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const session = await getServerAuthSession();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <main className="container mx-auto py-10">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <p className="mt-4">
        Selamat datang, <span className="font-semibold">{session.user.email}</span>!
      </p>
    </main>
  );
}