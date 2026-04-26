import type { Metadata } from "next";
import { requireAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { updateDailyReviewCap } from "@/lib/profile/actions";

export const metadata: Metadata = { title: "Profile — MedBuddy" };

export default async function ProfilePage() {
  const user = await requireAuth();
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("email, full_name, exam_pathway, daily_review_cap")
    .eq("id", user.id)
    .single();

  return (
    <div className="px-4 py-6 sm:py-8">
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-wider text-neutral-500">
            Profile
          </p>
          <h1 className="font-poppins text-2xl sm:text-3xl font-semibold text-neutral-900 mt-2">
            Study preferences
          </h1>
          <p className="text-sm text-neutral-500 mt-2">
            Tune your daily review workload without changing the scheduling algorithm.
          </p>
        </div>

        <section className="rounded-xl bg-white border border-neutral-200/70 shadow-card p-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wider text-neutral-500">
                Account
              </p>
              <h2 className="font-poppins text-lg font-semibold text-neutral-900 mt-1">
                {profile?.full_name || "MedBuddy learner"}
              </h2>
              <p className="text-sm text-neutral-500 mt-1">{profile?.email ?? user.email}</p>
            </div>
            {profile?.exam_pathway && (
              <span className="self-start rounded-full bg-info/[0.06] border border-info/15 px-3 py-1 text-xs font-medium text-info">
                {profile.exam_pathway.toUpperCase()}
              </span>
            )}
          </div>
        </section>

        <section className="rounded-xl bg-white border border-neutral-200/70 shadow-card p-6">
          <form action={updateDailyReviewCap} className="space-y-5">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wider text-neutral-500">
                Flashcards
              </p>
              <h2 className="font-poppins text-lg font-semibold text-neutral-900 mt-1">
                Daily review cap
              </h2>
              <p className="text-sm text-neutral-500 mt-1">
                Your due queue stops at this number each day. New and overdue cards remain
                scheduled for the next review session.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
              <label className="block flex-1">
                <span className="text-sm font-medium text-neutral-700">Cards per day</span>
                <input
                  type="number"
                  name="daily_review_cap"
                  min={10}
                  max={300}
                  step={10}
                  defaultValue={profile?.daily_review_cap ?? 100}
                  className="mt-2 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40"
                />
              </label>
              <button
                type="submit"
                className="rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-white hover:bg-primary/90 transition-all duration-200 active:scale-[0.98]"
              >
                Save
              </button>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}
