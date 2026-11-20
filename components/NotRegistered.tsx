export default function NotRegistered({ email }: { email: string }) {
  return (
    <div className="rounded-xl bg-amber-50 p-5 text-amber-900">
      <p className="font-semibold">Akaun ini belum dihubungkan dengan mana-mana outlet.</p>
      <p className="mt-2 text-sm">Minta BinaLab hubungkan akaun anda. Untuk BinaLab, dalam Supabase SQL Editor:</p>
      <code className="mt-2 block rounded bg-white p-2 text-xs">select public.add_staff(&apos;slug-outlet&apos;, &apos;{email}&apos;, &apos;kru&apos;);</code>
    </div>
  );
}
