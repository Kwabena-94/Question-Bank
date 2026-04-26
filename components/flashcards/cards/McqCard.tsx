"use client";

import type { FlashcardMcqOption } from "@/types";

interface Props {
  front: string;
  options: FlashcardMcqOption[];
  selectedLabel: string | null;
  revealed: boolean;
  onSelect: (option: FlashcardMcqOption) => void;
}

export default function McqCard({
  front,
  options,
  selectedLabel,
  revealed,
  onSelect,
}: Props) {
  return (
    <div className="space-y-4">
      <p className="text-base sm:text-lg text-neutral-900 leading-relaxed font-medium">
        {front}
      </p>
      <div className="space-y-2">
        {options.map((option) => {
          const selected = option.label === selectedLabel;
          const showCorrect = revealed && option.correct;
          const showWrong = revealed && selected && !option.correct;
          const optionClass = showCorrect
            ? "border-emerald-300 bg-emerald-50 text-emerald-900"
            : showWrong
              ? "border-rose-300 bg-rose-50 text-rose-900"
              : selected
                ? "border-primary/50 bg-primary/[0.08] text-neutral-900"
                : "border-neutral-200 bg-white text-neutral-700 hover:border-neutral-300 hover:bg-neutral-50";

          return (
            <button
              key={option.label}
              type="button"
              onClick={() => !revealed && onSelect(option)}
              disabled={revealed}
              className={`w-full rounded-xl border px-3 py-3 text-left transition-all duration-200 active:scale-[0.98] disabled:cursor-default ${optionClass}`}
            >
              <div className="flex gap-3">
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full border border-current/20 text-xs font-semibold">
                  {option.label}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-sm leading-relaxed">{option.text}</div>
                  {revealed && option.explanation && (
                    <p className="mt-1 text-xs leading-relaxed opacity-75">
                      {option.explanation}
                    </p>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
