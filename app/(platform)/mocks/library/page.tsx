import Link from "next/link";
import { Metadata } from "next";
import { requireAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Mock library — MedBuddy" };

export default async function MockLibraryPage() {
  const user = await requireAuth();
  const supabase = await createClient();

  const [{ data: templates }, { data: inProgress }, { data: submitted }] =
    await Promise.all([
      supabase
        .from("mock_templates")
        .select("id, title, description, question_count, duration_minutes")
        .eq("is_published", true)
        .order("question_count", { ascending: true }),
      supabase
        .from("mock_attempts")
        .select("id, mock_template_id")
        .eq("user_id", user.id)
        .eq("status", "in_progress"),
      supabase
        .from("mock_attempts")
        .select("mock_template_id")
        .eq("user_id", user.id)
        .eq("status", "submitted"),
    ]);

  const inProgressByTemplate = new Map(
    (inProgress ?? []).map((a) => [a.mock_template_id, a.id])
  );
  const submittedTemplates = new Set(
    (submitted ?? [])
      .map((a) => a.mock_template_id)
      .filter((x): x is string => !!x)
  );

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      <Link
        href="/mocks"
        className="text-sm text-neutral-500 hover:text-neutral-700 inline-flex items-center gap-1"
      >
        ← Back to mocks
      </Link>

      <div>
        <h1 className="font-poppins text-2xl font-semibold text-neutral-900 tracking-tight">
          Mock library
        </h1>
        <p className="text-sm text-neutral-500 mt-1">
          Every pre-defined mock available on MedBuddy. Pick one to start a timed,
          exam-mode simulation.
        </p>
      </div>

      {templates && templates.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {templates.map((t) => {
            const resumeId = inProgressByTemplate.get(t.id);
            const completed = submittedTemplates.has(t.id);
            return (
              <div
                key={t.id}
                className="rounded-xl bg-white border border-neutral-200/70 shadow-card hover:shadow-card-hover transition-shadow duration-200 p-5 flex flex-col"
              >
                <div className="flex items-start justify-between gap-3">
                  <h2 className="font-poppins font-semibold text-base text-neutral-900 leading-snug">
                    {t.title}
                  </h2>
                  {completed && (
                    <span className="text-[10px] font-medium uppercase tracking-wider text-green-700 bg-green-50 border border-green-100 rounded px-1.5 py-0.5 flex-shrink-0">
                      Completed
                    </span>
                  )}
                </div>
                {t.description && (
                  <p className="text-sm text-neutral-500 mt-1.5 leading-relaxed">
                    {t.description}
                  </p>
                )}
                <div className="flex items-center gap-3 mt-3 text-xs text-neutral-500">
                  <span>{t.question_count} questions</span>
                  <span className="text-neutral-300">·</span>
                  <span>{t.duration_minutes} min</span>
                </div>

                <div className="mt-5 pt-4 border-t border-neutral-100">
                  {resumeId ? (
                    <Link
                      href={`/mocks/attempt/${resumeId}`}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-accent text-white font-poppins font-medium text-sm rounded-md hover:opacity-95 active:scale-[0.98] transition-all duration-200"
                    >
                      Resume
                    </Link>
                  ) : (
                    <Link
                      href={`/mocks/${t.id}/start`}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white font-poppins font-medium text-sm rounded-md shadow-sm hover:bg-primary-hover active:scale-[0.98] transition-all duration-200"
                    >
                      Start mock
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-xl bg-white border border-neutral-200/70 shadow-card p-8 text-center">
          <p className="text-sm text-neutral-500">
            No mock templates published yet.
          </p>
        </div>
      )}
    </div>
  );
}
