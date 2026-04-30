"use client";

const CLOZE_RE = /\{\{c(\d+)::([^}]+?)\}\}/g;

interface Props {
  front: string;
  revealed: boolean;
}

export default function ClozeCard({ front, revealed }: Props) {
  const parts: Array<{ text: string; cloze?: boolean; index?: string }> = [];
  let lastIndex = 0;
  CLOZE_RE.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = CLOZE_RE.exec(front)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ text: front.slice(lastIndex, match.index) });
    }
    parts.push({ text: match[2], cloze: true, index: match[1] });
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < front.length) {
    parts.push({ text: front.slice(lastIndex) });
  }

  return (
    <p className="text-base sm:text-lg text-neutral-900 leading-relaxed font-medium">
      {parts.map((part, index) => {
        if (!part.cloze) return <span key={index}>{part.text}</span>;
        return revealed ? (
          <span
            key={index}
            className="mx-1 rounded-md bg-emerald-50 px-2 py-0.5 text-emerald-700 border border-emerald-100"
          >
            {part.text}
          </span>
        ) : (
          <span
            key={index}
            aria-label={`Cloze ${part.index}`}
            className="mx-1 inline-flex min-w-20 items-center justify-center rounded-md border border-dashed border-neutral-300 bg-neutral-50 px-3 py-0.5 text-neutral-400"
          >
            ___
          </span>
        );
      })}
    </p>
  );
}
