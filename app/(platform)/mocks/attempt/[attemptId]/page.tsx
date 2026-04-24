import { notFound, redirect } from "next/navigation";
import { Metadata } from "next";
import { requireAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import MockRunner from "@/components/mocks/MockRunner";

export const metadata: Metadata = { title: "Mock in progress — MedBuddy" };

interface PageProps {
  params: { attemptId: string };
}

export default async function MockAttemptPage({ params }: PageProps) {
  const user = await requireAuth();
  const supabase = await createClient();

  const { data: attempt, error } = await supabase
    .from("mock_attempts")
    .select(
      "id, user_id, mock_template_id, status, started_at, submitted_at, question_ids, duration_minutes, title"
    )
    .eq("id", params.attemptId)
    .single();

  if (error || !attempt) notFound();
  if (attempt.user_id !== user.id) notFound();
  if (attempt.status !== "in_progress") {
    redirect(`/mocks/attempt/${attempt.id}/review`);
  }

  let questionIds: string[];
  let title: string;
  let durationMinutes: number;

  if (attempt.mock_template_id) {
    const { data: template } = await supabase
      .from("mock_templates")
      .select("title, duration_minutes, question_ids")
      .eq("id", attempt.mock_template_id)
      .single();
    if (!template) notFound();
    questionIds = template.question_ids as string[];
    title = template.title;
    durationMinutes = template.duration_minutes;
  } else {
    if (!attempt.question_ids?.length || !attempt.duration_minutes) notFound();
    questionIds = attempt.question_ids as string[];
    title = attempt.title ?? "Custom mock";
    durationMinutes = attempt.duration_minutes;
  }

  const { data: answers } = await supabase
    .from("mock_attempt_answers")
    .select("question_id, selected_option, is_flagged, position")
    .eq("mock_attempt_id", attempt.id)
    .order("position");

  const { data: questions } = await supabase
    .from("questions")
    .select("id, content, options")
    .in("id", questionIds);

  const byId = new Map((questions ?? []).map((q) => [q.id, q]));
  const ordered = questionIds
    .map((id) => byId.get(id))
    .filter(Boolean) as { id: string; content: string; options: { key: string; text: string }[] }[];

  return (
    <MockRunner
      attemptId={attempt.id}
      title={title}
      startedAtIso={attempt.started_at}
      durationMinutes={durationMinutes}
      questions={ordered}
      initialAnswers={(answers ?? []).map((a) => ({
        questionId: a.question_id,
        selected: a.selected_option as "a" | "b" | "c" | "d" | "e" | null,
        flagged: !!a.is_flagged,
      }))}
    />
  );
}
