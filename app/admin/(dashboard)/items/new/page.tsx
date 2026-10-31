import ItemForm from "@/components/ItemForm";
import Notice from "@/components/Notice";
import { createClient } from "@/lib/supabase/server";
import type { Category } from "@/lib/types";

export default async function NewItemPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  const supabase = await createClient();
  const { data } = await supabase.from("categories").select("*").order("sort_order").order("name");
  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold">Tambah item</h1>
      <Notice error={error} />
      <ItemForm categories={(data ?? []) as Category[]} />
    </div>
  );
}
