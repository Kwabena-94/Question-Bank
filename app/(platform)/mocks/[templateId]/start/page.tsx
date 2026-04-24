import { notFound } from "next/navigation";
import { Metadata } from "next";
import Link from "next/link";
import { requireAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import StartMockButton from "@/components/mocks/StartMockButton";

export const metadata: Metadata = { title: "Start mock — MedBuddy" };

interface PageProps {
  params: { templateId: string };
}

export default async function StartMockPage({ params }: PageProps) {
  await requireAuth();
  const supabase = await createClient();

  const { data: template } = await supabase
    .from("mock_templates")
    .select(
      "id, title, description, question_count, duration_minutes, domain_distribution"
    )
    .eq("id", params.templateId)
    .eq("is_published", true)
    .single();

  if (!template) notFound();

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Link
        href="/mocks"
        className="text-sm text-neutral-500 hover:text-neutral-700"
      >
        ← Back to mocks
      </Link>

      <div className="card-surface p-6">
        <h1 className="font-poppins text-xl font-semibold text-neutral-900">
          {template.title}
        </h1>
        {template.description && (
          <p className="text-sm text-neutral-500 mt-1">{template.description}</p>
        )}

        <div className="mt-5 grid grid-cols-2 gap-3">
          <div className="rounded-md border border-neutral-200 p-3">
            <p className="text-xs text-neutral-500">Questions</p>
            <p className="font-poppins font-semibold text-lg text-neutral-900">
              {template.question_count}
            </p>
          </div>
          <div className="rounded-md border border-neutral-200 p-3">
            <p className="text-xs text-neutral-500">Time limit</p>
            <p className="font-poppins font-semibold text-lg text-neutral-900">
              {template.duration_minutes} min
            </p>
          </div>
        </div>

        <div className="mt-5 text-xs text-neutral-500 space-y-2 bg-neutral-50 rounded-md p-4">
          <p className="font-medium text-neutral-700">Before you start</p>
          <ul className="list-disc pl-4 space-y-1">
            <li>The timer runs continuously — it does not pause if you leave.</li>
            <li>Explanations are locked until you submit.</li>
            <li>You can flag questions and revisit them before submitting.</li>
            <li>Leaving the page is fine — your answers autosave and you can resume.</li>
          </ul>
        </div>

        <div className="mt-6">
          <StartMockButton templateId={template.id} />
        </div>
      </div>
    </div>
  );
}
