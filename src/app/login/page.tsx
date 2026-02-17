import LoginForm from "./ui";

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center p-6">
      <div className="w-full max-w-md border border-white/10 rounded-lg p-6 bg-white/5">
        <h1 className="text-2xl font-medium tracking-tight">Sonance Marketing Hub</h1>
        <p className="mt-2 text-sm text-white/70">Sign in with your Sonance email.</p>
        <div className="mt-6">
          <LoginForm />
        </div>
      </div>
    </main>
  );
}
