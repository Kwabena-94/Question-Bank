import Link from "next/link";

interface Props {
  attemptId: string;
  label?: string;
}

/**
 * Soft accent banner surfaced on /mocks when the user has a custom mock in
 * flight. Placed above the hero row so it's the first thing seen without
 * competing with the recommended/readiness layout.
 */
export default function InProgressBanner({
  attemptId,
  label = "Custom mock",
}: Props) {
  return (
    <div className="rounded-lg bg-accent-light border border-accent/25 px-4 py-3 flex items-center gap-3 flex-wrap">
      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white border border-accent/20 text-accent flex-shrink-0">
        <ClockIcon />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-neutral-900">
          You have an in-progress {label.toLowerCase()}
        </p>
        <p className="text-xs text-neutral-500 mt-0.5">
          Pick up where you left off before starting a new one.
        </p>
      </div>
      <Link
        href={`/mocks/attempt/${attemptId}`}
        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md bg-accent text-white font-poppins font-medium text-xs shadow-sm hover:opacity-95 active:scale-[0.98] transition-all duration-200"
      >
        Resume
        <ArrowIcon />
      </Link>
    </div>
  );
}

function ClockIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  );
}
