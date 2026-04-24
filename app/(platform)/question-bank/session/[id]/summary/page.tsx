import Link from "next/link";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import { requireAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { CLINICAL_SPECIALTY_LABELS, type ClinicalSpecialty } from "@/types";

export const metadata: Metadata = { title: "Session summary — MedBuddy" };

interface PageProps {
  params: { id: string };
}

export default async function QBSessionSummaryPage({ params }: PageProps) {
  const user = await requireAuth();
  const supabase = await createClient();

  const { data: session } = await supabase
    .from("qb_sessions")
    .select("id, question_ids, length, created_at, completed_at")
    .eq("id", params.id)
    .eq("user_id", user.id)
    .single();

  if (!session) notFound();

  const { data: attempts } = await supabase
    .from("question_attempts")
    .select("question_id, is_correct, selected_option")
    .eq("session_id", session.id)
    .eq("user_id", user.id);

  const { data: questions } = await supabase
    .from("questions")
    .select("id, clinical_specialty")
    .in("id", session.question_ids);

  const specialtyById = new Map(
    (questions ?? []).map((q) => [q.id, q.clinical_specialty as ClinicalSpecialty | null])
  );

  const total = attempts?.length ?? 0;
  const correct = attempts?.filter((a) => a.is_correct).length ?? 0;
  const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;

  const perSpecialty: Record<string, { total: number; correct: number }> = {};
  for (const a of attempts ?? []) {
    const s = specialtyById.get(a.question_id);
    if (!s) continue;
    perSpecialty[s] ??= { total: 0, correct: 0 };
    perSpecialty[s].total += 1;
    if (a.is_correct) perSpecialty[s].correct += 1;
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="font-poppins text-2xl font-semibold text-neutral-900">
          Session complete
        </h1>
        <p className="text-neutral-500 text-sm mt-1">
          {correct} of {total} correct
        </p>
      </div>

      <div className="card-surface p-6 border-t-2 border-primary">
        <p className="text-xs text-neutral-500 mb-1">Accuracy</p>
        <p className="font-poppins font-bold text-4xl text-neutral-900">
          {accuracy}%
        </p>
        <div className="mt-3 h-2 bg-neutral-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full"
            style={{ width: `${accuracy}%` }}
          />
        </div>
      </div>

      {Object.keys(perSpecialty).length > 0 && (
        <div className="card-surface p-6">
          <h2 className="font-poppins font-semibold text-sm text-neutral-900 mb-4">
            By specialty
          </h2>
          <div className="space-y-3">
            {Object.entries(perSpecialty).map(([s, v]) => {
              const pct = Math.round((v.correct / v.total) * 100);
              return (
                <div key={s}>
                  <div className="flex justify-between text-xs text-neutral-600 mb-1">
                    <span>
                      {CLINICAL_SPECIALTY_LABELS[s as ClinicalSpecialty] ?? s}
                    </span>
                    <span>
                      {v.correct}/{v.total} · {pct}%
                    </span>
                  </div>
                  <div className="h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex gap-3">
        <Link
          href="/question-bank"
          className="flex-1 text-center py-3 bg-primary text-white font-poppins font-medium text-sm rounded-md hover:bg-primary-hover transition-colors"
        >
          New session
        </Link>
        <Link
          href="/home"
          className="flex-1 text-center py-3 border border-neutral-200 text-neutral-700 font-poppins font-medium text-sm rounded-md hover:bg-neutral-50 transition-colors"
        >
          Back to home
        </Link>
      </div>
    </div>
  );
}
