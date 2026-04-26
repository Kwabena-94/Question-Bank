"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const reviewCapSchema = z.object({
  daily_review_cap: z.coerce.number().int().min(10).max(300),
});

export async function updateDailyReviewCap(formData: FormData) {
  const user = await requireAuth();
  const parsed = reviewCapSchema.parse({
    daily_review_cap: formData.get("daily_review_cap"),
  });
  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ daily_review_cap: parsed.daily_review_cap })
    .eq("id", user.id);

  if (error) throw new Error(error.message);
  revalidatePath("/profile");
  revalidatePath("/flashcards/review");
}
