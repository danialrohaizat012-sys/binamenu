export default function NotRegistered({ userId }: { userId: string }) {
  return (
    <div className="rounded-xl bg-amber-50 p-5 text-amber-900">
      <p className="font-semibold">Akaun ini belum didaftarkan untuk kedai ini.</p>
      <p className="mt-2 text-sm">Minta owner atau BinaLab jalankan SQL ini dalam Supabase SQL Editor:</p>
      <code className="mt-2 block rounded bg-white p-2 text-xs">
        insert into public.admins (user_id, role) values (&apos;{userId}&apos;, &apos;kru&apos;);
      </code>
      <p className="mt-2 text-xs">Guna &apos;owner&apos; untuk akses penuh (menu, meja, laporan).</p>
    </div>
  );
}
