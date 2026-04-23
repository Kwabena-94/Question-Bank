import { Metadata } from "next";
import { requireAuth } from "@/lib/auth";

export const metadata: Metadata = { title: "Home — MedCognito" };

export default async function HomePage() {
  const user = await requireAuth();

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Welcome */}
      <div>
        <h1 className="font-poppins text-2xl font-semibold text-neutral-900">
          Good morning 👋
        </h1>
        <p className="text-neutral-500 text-sm mt-1">
          Ready to continue your MCCQE1 prep? Here&apos;s where you left off.
        </p>
      </div>

      {/* Quick action cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          {
            label: "Continue Learning",
            desc: "Pick up where you left off",
            href: "/question-bank",
            color: "bg-primary",
          },
          {
            label: "Start Mock",
            desc: "Timed practice exam",
            href: "/mocks",
            color: "bg-neutral-900",
          },
          {
            label: "Generate Flashcards",
            desc: "AI-powered study cards",
            href: "/flashcards",
            color: "bg-accent",
          },
        ].map((item) => (
          <a
            key={item.href}
            href={item.href}
            className="card-surface p-5 flex flex-col gap-2 hover:shadow-card-hover transition-shadow group"
          >
            <div className={`w-8 h-8 rounded-md ${item.color} opacity-90 group-hover:opacity-100 transition-opacity`} />
            <span className="font-poppins font-semibold text-sm text-neutral-900">{item.label}</span>
            <span className="text-xs text-neutral-500">{item.desc}</span>
          </a>
        ))}
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Streak", value: "—", unit: "days" },
          { label: "Accuracy", value: "—", unit: "%" },
          { label: "Mocks", value: "—", unit: "completed" },
          { label: "Flashcards", value: "—", unit: "reviewed" },
        ].map((stat) => (
          <div key={stat.label} className="card-surface p-4">
            <p className="text-xs text-neutral-500 mb-1">{stat.label}</p>
            <p className="font-poppins font-bold text-2xl text-neutral-900">
              {stat.value}
            </p>
            <p className="text-xs text-neutral-400">{stat.unit}</p>
          </div>
        ))}
      </div>

      {/* Readiness placeholder */}
      <div className="card-surface p-6 border-t-2 border-primary">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="font-poppins font-semibold text-base text-neutral-900">
              MCCQE1 Readiness
            </h2>
            <p className="text-sm text-neutral-500 mt-1">
              Answer 50 questions across 2+ domains to unlock your readiness score.
            </p>
          </div>
          <span className="text-xs font-medium px-2.5 py-1 bg-neutral-100 text-neutral-500 rounded-full">
            Not enough data
          </span>
        </div>
        <div className="mt-4 h-2 bg-neutral-100 rounded-full overflow-hidden">
          <div className="h-full w-0 bg-primary rounded-full" />
        </div>
      </div>

      {/* Next best actions placeholder */}
      <div className="card-surface p-6">
        <h2 className="font-poppins font-semibold text-base text-neutral-900 mb-3">
          Next Best Actions
        </h2>
        <div className="text-sm text-neutral-400 py-4 text-center">
          Start practising to get personalised recommendations.
        </div>
      </div>

      {/* Temp: user ID for auth verification */}
      <p className="text-xs text-neutral-300 text-right">uid: {user.id}</p>
    </div>
  );
}
