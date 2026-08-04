import { LoginForm } from "./_components/LoginForm";

export default function LoginPage() {
  return (
    <main className="container mx-auto py-10">
      <h1 className="text-2xl font-bold text-center mb-6">Login</h1>
      <LoginForm />
    </main>
  );
}