import { signIn } from "../actions";
import Notice from "@/components/Notice";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  return (
    <main className="flex min-h-dvh items-center justify-center p-6">
      <form action={signIn} className="w-full max-w-sm rounded-2xl bg-white p-6 shadow">
        <h1 className="mb-1 text-xl font-bold">Log masuk admin</h1>
        <p className="mb-5 text-sm text-stone-500">Urus menu kedai anda.</p>
        <Notice error={error} />
        <label className="mb-3 block text-sm font-medium">
          Emel
          <input name="email" type="email" required autoComplete="email" className="input mt-1" />
        </label>
        <label className="mb-5 block text-sm font-medium">
          Kata laluan
          <input name="password" type="password" required autoComplete="current-password" className="input mt-1" />
        </label>
        <button className="btn-primary w-full">Log masuk</button>
      </form>
    </main>
  );
}
