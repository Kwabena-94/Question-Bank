import Link from "next/link";
import { Metadata } from "next";
import { requireAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Mock history — MedBuddy" };

const PAGE_SIZE = 20;

interface PageProps {
  searchParams: { page?: string; template?: string };
}

export default async function MockHistoryPage({ searchParams }: PageProps) {
  const user = await requireAuth();
  const supabase = await createClient();

  const page = Math.max(1, parseInt(searchParams.page ?? "1", 10) || 1);
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const { data: templates } = await supabase
    .from("mock_templates")
    .select("id, title");
  const templateById = new Map((templates ?? []).map((t) => [t.id, t.title]));

  let q = supabase
    .from("mock_attempts")
    .select(
      "id, mock_template_id, title, submitted_at, score, time_spent_seconds, custom_config",
      { count: "exact" }
    )
    .eq("user_id", user.id)
    .eq("status", "submitted")
    .order("submitted_at", { ascending: false })
    .range(from, to);

  if (searchParams.template === "custom") {
    q = q.is("mock_template_id", null);
  } else if (searchParams.template) {
    q = q.eq("mock_template_id", searchParams.template);
  }

  const { data: attempts, count } = await q;
  const total = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  function hrefForPage(p: number) {
    const params = new URLSearchParams();
    if (p > 1) params.set("page", String(p));
    if (searchParams.template) params.set("template", searchParams.template);
    const qs = params.toString();
    return `/mocks/history${qs ? `?${qs}` : ""}`;
  }

  function hrefForFilter(tpl: string | null) {
    const params = new URLSearchParams();
    if (tpl) params.set("template", tpl);
    const qs = params.toString();
    return `/mocks/history${qs ? `?${qs}` : ""}`;
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <Link href="/mocks" className="text-sm text-neutral-500 hover:text-neutral-700">
          ← Back to mocks
        </Link>
      </div>

      <div>
        <h1 className="font-poppins text-2xl font-semibold text-neutral-900">
          Mock history
        </h1>
        <p className="text-sm text-neutral-500 mt-1">
          {total} submitted attempt{total === 1 ? "" : "s"}
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <FilterChip
          href={hrefForFilter(null)}
          active={!searchParams.template}
          label="All"
        />
        <FilterChip
          href={hrefForFilter("custom")}
          active={searchParams.template === "custom"}
          label="Custom"
        />
        {(templates ?? []).map((t) => (
          <FilterChip
            key={t.id}
            href={hrefForFilter(t.id)}
            active={searchParams.template === t.id}
            label={t.title}
          />
        ))}
      </div>

      <div className="card-surface divide-y divide-neutral-100">
        {(attempts ?? []).length === 0 && (
          <div className="p-6 text-sm text-neutral-500 text-center">
            No attempts yet for this filter.
          </div>
        )}
        {(attempts ?? []).map((a) => {
          const label = a.mock_template_id
            ? templateById.get(a.mock_template_id) ?? "Mock"
            : a.title ?? "Custom mock";
          const score = Math.round(Number(a.score ?? 0));
          const mins = Math.round((a.time_spent_seconds ?? 0) / 60);
          return (
            <div key={a.id} className="p-4 flex items-center justify-between">
              <div className="min-w-0">
                <p className="text-sm text-neutral-800 truncate">{label}</p>
                <p className="text-xs text-neutral-400">
                  {new Date(a.submitted_at!).toLocaleString()} · {mins} min
                </p>
              </div>
              <div className="flex items-center gap-4 flex-shrink-0">
                <span className="font-poppins font-semibold text-lg text-neutral-900">
                  {score}%
                </span>
                <Link
                  href={`/mocks/attempt/${a.id}/review`}
                  className="text-sm text-primary hover:underline"
                >
                  Review
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          {page > 1 ? (
            <Link
              href={hrefForPage(page - 1)}
              className="text-neutral-600 hover:text-neutral-900"
            >
              ← Newer
            </Link>
          ) : (
            <span />
          )}
          <span className="text-neutral-400">
            Page {page} of {totalPages}
          </span>
          {page < totalPages ? (
            <Link
              href={hrefForPage(page + 1)}
              className="text-neutral-600 hover:text-neutral-900"
            >
              Older →
            </Link>
          ) : (
            <span />
          )}
        </div>
      )}
    </div>
  );
}

function FilterChip({
  href,
  active,
  label,
}: {
  href: string;
  active: boolean;
  label: string;
}) {
  return (
    <Link
      href={href}
      className={
        "px-3 py-1.5 rounded-full border text-xs font-medium transition-colors " +
        (active
          ? "border-primary bg-primary/8 text-primary"
          : "border-neutral-200 text-neutral-600 hover:border-neutral-300")
      }
    >
      {label}
    </Link>
  );
}
