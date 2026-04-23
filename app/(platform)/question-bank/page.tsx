import { Metadata } from "next";
import { requireAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import StartSessionForm from "@/components/question-bank/StartSessionForm";
import type { ClinicalSpecialty } from "@/types";

export const metadata: Metadata = { title: "Question Bank — MedCognito" };

export default async function QuestionBankPage() {
  const user = await requireAuth();
  const supabase = await createClient();

  // Count available published questions per specialty (for filter UI hints)
  const { data: counts } = await supabase
    .from("questions")
    .select("clinical_specialty")
    .eq("is_published", true);

  const specialtyCounts: Record<string, number> = {};
  for (const row of counts ?? []) {
    const s = row.clinical_specialty as ClinicalSpecialty | null;
    if (!s) continue;
    specialtyCounts[s] = (specialtyCounts[s] ?? 0) + 1;
  }

  const { count: attemptCount } = await supabase
    .from("question_attempts")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("source", "question_bank");

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="font-poppins text-2xl font-semibold text-neutral-900">
          Question Bank
        </h1>
        <p className="text-neutral-500 text-sm mt-1">
          Tutor-mode practice. Pick a session length and filters, then start.
          Explanations appear after each answer.
        </p>
      </div>

      <StartSessionForm
        specialtyCounts={specialtyCounts}
        attemptCount={attemptCount ?? 0}
      />
    </div>
  );
}
