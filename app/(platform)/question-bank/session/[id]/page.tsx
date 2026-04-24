import { notFound, redirect } from "next/navigation";
import { Metadata } from "next";
import { requireAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import SessionRunner from "@/components/question-bank/SessionRunner";
import type { Question } from "@/types";

export const metadata: Metadata = { title: "Practice — MedBuddy" };

interface PageProps {
  params: { id: string };
}

export default async function QBSessionPage({ params }: PageProps) {
  const user = await requireAuth();
  const supabase = await createClient();

  const { data: session, error } = await supabase
    .from("qb_sessions")
    .select("id, question_ids, length, completed_at")
    .eq("id", params.id)
    .eq("user_id", user.id)
    .single();

  if (error || !session) notFound();

  if (session.completed_at) {
    redirect(`/question-bank/session/${session.id}/summary`);
  }

  const { data: questions } = await supabase
    .from("questions")
    .select(
      "id, content, options, correct_option, explanation, clinical_specialty, difficulty"
    )
    .in("id", session.question_ids);

  // Preserve session order
  const byId = new Map((questions ?? []).map((q) => [q.id, q]));
  const ordered = (session.question_ids as string[])
    .map((id) => byId.get(id))
    .filter(Boolean) as Question[];

  return <SessionRunner sessionId={session.id} questions={ordered} />;
}
