"use server";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { QUEST_CATEGORIES } from "@/lib/quests/schema";

export async function finishOnboarding(categories: string[]): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const cats = categories.filter((c) => (QUEST_CATEGORIES as readonly string[]).includes(c));
  await supabase
    .from("profiles")
    .update({
      enabled_categories: cats.length ? cats : [...QUEST_CATEGORIES],
      onboarded_at: new Date().toISOString(),
    })
    .eq("id", user.id);
  revalidatePath("/home");
}
