import { notFound } from "next/navigation";
import ItemForm from "@/components/ItemForm";
import Notice from "@/components/Notice";
import { createClient } from "@/lib/supabase/server";
import type { Category, MenuItem } from "@/lib/types";

export default async function EditItemPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;
  const supabase = await createClient();
  const [{ data: item }, { data: categories }] = await Promise.all([
    supabase.from("menu_items").select("*").eq("id", id).maybeSingle(),
    supabase.from("categories").select("*").order("sort_order").order("name"),
  ]);
  if (!item) notFound();
  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold">Edit item</h1>
      <Notice error={error} />
      <ItemForm item={item as MenuItem} categories={(categories ?? []) as Category[]} />
    </div>
  );
}
