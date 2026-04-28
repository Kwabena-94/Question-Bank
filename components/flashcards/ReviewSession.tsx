"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Award, Check, Clock3, RotateCcw } from "lucide-react";
import { track } from "@/lib/analytics/track";
import {
  cacheDueCards,
  flushQueuedReviews,
  getQueuedReviewCount,
  queueReview,
} from "@/lib/flashcards/offline-review";
import type { CardFormat, FlashcardMcqOption, Grade } from "@/types";
import ClozeCard from "./cards/ClozeCard";
import McqCard from "./cards/McqCard";

interface DueCard {
  id: string;
  set_id: string;
  format: CardFormat;
  type: string;
  context: string | null;
  front: string;
  back: string;
  reasoning: string | null;
  mcq_options: FlashcardMcqOption[] | null;
  is_new: boolean;
}

interface Props {
  cards: DueCard[];
}

const GRADE_LABEL: Record<Grade, string> = {
  1: "Again",
  2: "Hard",
  3: "Good",
  4: "Easy",
};

const GRADE_HINT: Record<Grade, string> = {
  1: "1 min",
  2: "5 min",
  3: "15 min",
  4: "4 days",
};

const GRADE_STYLE: Record<Grade, string> = {
  1: "border-rose-200 bg-rose-50/80 text-rose-700 hover:border-rose-300 hover:bg-rose-50",
  2: "border-amber-200 bg-amber-50/80 text-amber-800 hover:border-amber-300 hover:bg-amber-50",
  3: "border-neutral-200 bg-white text-neutral-700 hover:border-neutral-300 hover:bg-neutral-50",
  4: "border-emerald-200 bg-emerald-50/80 text-emerald-700 hover:border-emerald-300 hover:bg-emerald-50",
};

const GRADE_DOT: Record<Grade, string> = {
  1: "bg-rose-100 text-rose-700",
  2: "bg-amber-100 text-amber-800",
  3: "bg-neutral-100 text-neutral-600",
  4: "bg-emerald-100 text-emerald-700",
};

const FORMAT_LABEL: Record<CardFormat, string> = {
  basic: "Recall",
  cloze: "Cloze",
  mcq: "Practice Q",
};

export default function ReviewSession({ cards: initial }: Props) {
  const router = useRouter();
  const [queue, setQueue] = useState<DueCard[]>(initial);
  const [reveal, setReveal] = useState(false);
  const [controlsReady, setControlsReady] = useState(false);
  const [answer, setAnswer] = useState("");
  const [selectedMcq, setSelectedMcq] = useState<FlashcardMcqOption | null>(null);
  const [grader, setGrader] = useState<{ grade: Grade; rationale: string } | null>(null);
  const [graderLoading, setGraderLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [online, setOnline] = useState(true);
  const [queuedCount, setQueuedCount] = useState(0);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [motionGrade, setMotionGrade] = useState<Grade | null>(null);
  const [tally, setTally] = useState({ reviewed: 0, again: 0, hard: 0, good: 0, easy: 0 });
  const startedAt = useRef(Date.now());
  const reviewedAny = useRef(false);

  const current = queue[0];
  const remaining = queue.length;
  const totalAtStart = initial.length;
  const done = totalAtStart - remaining;
  const pct = totalAtStart ? Math.round((done / totalAtStart) * 100) : 0;
  const isMcq = current?.format === "mcq" && !!current.mcq_options?.length;
  const estimatedMin = Math.max(1, Math.round(initial.length * 0.33));
  const elapsedSeconds = Math.max(0, Math.round((Date.now() - startedAt.current) / 1000));
  const retentionScore = tally.reviewed
    ? Math.round(((tally.good + tally.easy) / tally.reviewed) * 100)
    : 0;

  useEffect(() => {
    track.flashcardsReviewStarted({ due_count: initial.length });
  }, [initial.length]);

  useEffect(() => {
    setOnline(navigator.onLine);
    void cacheDueCards(initial);
    void getQueuedReviewCount().then(setQueuedCount);

    async function syncQueued() {
      setOnline(navigator.onLine);
      if (!navigator.onLine) return;
      const flushed = await flushQueuedReviews().catch(() => 0);
      if (flushed > 0) {
        const count = await getQueuedReviewCount();
        setQueuedCount(count);
      }
    }

    function handleOffline() {
      setOnline(false);
    }

    window.addEventListener("online", syncQueued);
    window.addEventListener("offline", handleOffline);
    void syncQueued();
    return () => {
      window.removeEventListener("online", syncQueued);
      window.removeEventListener("offline", handleOffline);
    };
  }, [initial]);

  const requestGrade = useCallback(async () => {
    if (!current || !answer.trim()) return;
    setGraderLoading(true);
    try {
      const res = await fetch("/api/flashcards/grade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ card_id: current.id, answer_text: answer.trim() }),
      });
      const json = await res.json();
      if (json?.available && json.grade) {
        setGrader({ grade: json.grade as Grade, rationale: json.rationale ?? "" });
      }
    } catch {
      // Smart grading is optional; manual grading always remains available.
    } finally {
      setGraderLoading(false);
    }
  }, [current, answer]);

  const onReveal = useCallback(() => {
    if (reveal || !current) return;
    setControlsReady(false);
    setReveal(true);
    window.setTimeout(() => setControlsReady(true), 360);
    if (!isMcq && answer.trim()) void requestGrade();
  }, [answer, current, isMcq, requestGrade, reveal]);

  const submit = useCallback(
    async (grade: Grade) => {
      if (!current || submitting) return;
      setSubmitting(true);
      setSubmitError(null);
      setMotionGrade(grade);
      const accepted = grader?.grade === grade;
      try {
        let inSession = false;
        try {
          const res = await fetch("/api/flashcards/review", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              card_id: current.id,
              grade,
              answer_text: answer.trim() || undefined,
              grader_suggestion: grader?.grade,
            }),
          });
          if (!res.ok) throw new Error("Review could not be saved.");
          const json = await res.json();
          inSession = !!json?.in_session;
        } catch (error) {
          if (navigator.onLine) {
            setSubmitError(error instanceof Error ? error.message : "Review could not be saved.");
            setMotionGrade(null);
            return;
          }
          await queueReview({
            card_id: current.id,
            grade,
            answer_text: answer.trim() || undefined,
            grader_suggestion: grader?.grade,
          });
          setQueuedCount((count) => count + 1);
        }

        track.flashcardReviewed({
          card_id: current.id,
          grade,
          used_grader: !!grader,
          in_session: inSession,
        });
        if (grader) {
          track.flashcardGraderUsed({
            card_id: current.id,
            suggestion: grader.grade,
            accepted,
          });
        }

        setTally((t) => ({
          reviewed: t.reviewed + 1,
          again: t.again + (grade === 1 ? 1 : 0),
          hard: t.hard + (grade === 2 ? 1 : 0),
          good: t.good + (grade === 3 ? 1 : 0),
          easy: t.easy + (grade === 4 ? 1 : 0),
        }));
        reviewedAny.current = true;

        window.setTimeout(() => {
          setQueue((q) => {
            const [head, ...rest] = q;
            if (inSession && head) return [...rest, head];
            return rest;
          });
          setReveal(false);
          setControlsReady(false);
          setAnswer("");
          setSelectedMcq(null);
          setGrader(null);
          setMotionGrade(null);
        }, grade === 2 ? 260 : 180);
      } finally {
        window.setTimeout(() => setSubmitting(false), 280);
      }
    },
    [current, answer, grader, submitting]
  );

  useEffect(() => {
    if (queue.length === 0 && reviewedAny.current) {
      const duration = Math.max(0, Math.round((Date.now() - startedAt.current) / 1000));
      track.flashcardsReviewCompleted({ ...tally, duration_seconds: duration });
    }
  }, [queue.length, tally]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!current) return;
      if (e.key === " " && !isTypingTarget(e.target)) {
        e.preventDefault();
        if (!reveal) onReveal();
        else if (controlsReady) submit(3);
        return;
      }
      if (!reveal && e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        onReveal();
        return;
      }
      if (!reveal || !controlsReady) return;
      if (e.key === "1") submit(1);
      else if (e.key === "2") submit(2);
      else if (e.key === "3") submit(3);
      else if (e.key === "4") submit(4);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [controlsReady, current, onReveal, reveal, submit]);

  const touch = useRef<{ x: number; y: number; t: number; longPress?: number } | null>(null);
  function onTouchStart(e: React.TouchEvent) {
    if (!reveal || !controlsReady) return;
    const t = e.touches[0];
    const longPress = window.setTimeout(() => submit(4), 600);
    touch.current = { x: t.clientX, y: t.clientY, t: Date.now(), longPress };
  }
  function clearLongPress() {
    if (touch.current?.longPress) window.clearTimeout(touch.current.longPress);
  }
  function onTouchEnd(e: React.TouchEvent) {
    if (!reveal || !controlsReady || !touch.current) return;
    clearLongPress();
    const t = e.changedTouches[0];
    const dx = t.clientX - touch.current.x;
    const dy = t.clientY - touch.current.y;
    const adx = Math.abs(dx);
    const ady = Math.abs(dy);
    touch.current = null;
    const THRESH = 60;
    if (adx < THRESH && ady < THRESH) return;
    if (adx > ady) {
      if (dx > 0) submit(3);
      else submit(1);
    } else if (dy < 0) {
      submit(2);
    }
  }
  function onTouchMove() {
    clearLongPress();
    if (touch.current) touch.current.longPress = undefined;
  }

  if (!current) {
    return (
      <div className="min-h-[calc(100vh-6rem)] px-4 py-6">
        <CompletionScreen
          reviewedAny={reviewedAny.current}
          tally={tally}
          elapsedSeconds={elapsedSeconds}
          retentionScore={retentionScore}
          online={online}
          queuedCount={queuedCount}
          onRefresh={() => router.refresh()}
        />
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-6rem)] bg-[radial-gradient(circle_at_50%_0%,rgba(158,14,39,0.07),transparent_32rem)] px-4 pb-8">
      <div className="sticky top-0 z-20 -mx-4 border-b border-neutral-200/70 bg-white/82 px-4 py-4 backdrop-blur-xl">
        <div className="mx-auto max-w-5xl space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[11px] font-medium uppercase tracking-wider text-neutral-500">
                Clinical Review
              </p>
              <h1 className="truncate font-poppins text-base font-semibold text-neutral-900 sm:text-lg">
                {sessionTitle(current)}
              </h1>
            </div>
            <Link
              href="/flashcards"
              className="rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-neutral-600 transition-colors hover:bg-neutral-50"
            >
              End Session
            </Link>
          </div>

          <div className="grid gap-2 sm:grid-cols-[auto_1fr_auto] sm:items-center sm:gap-4">
            <div className="text-[11px] font-medium uppercase tracking-wider text-neutral-500">
              Progress
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-neutral-100">
              <motion.div
                className="h-full rounded-full bg-primary"
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ type: "spring", stiffness: 180, damping: 24 }}
              />
            </div>
            <div className="flex items-center gap-3 text-xs font-medium text-neutral-600 sm:justify-end">
              <span>
                {Math.min(done + 1, totalAtStart)} / {totalAtStart}
              </span>
              <span className="h-4 w-px bg-neutral-200" />
              <span className="inline-flex items-center gap-1.5">
                <Clock3 className="h-3.5 w-3.5 text-neutral-400" />
                ~{estimatedMin} min
              </span>
              <span className="h-4 w-px bg-neutral-200" />
              <motion.span
                key={tally.reviewed}
                initial={{ scale: 0.94 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 420, damping: 22 }}
              >
                {tally.reviewed} reviewed
              </motion.span>
            </div>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-5xl space-y-6 pt-6">
        {(!online || queuedCount > 0) && (
          <div className="rounded-xl border border-info/15 bg-info/[0.06] px-4 py-3 text-sm text-neutral-700">
            {!online
              ? "Offline mode: reviews are saved on this device and will sync when you're back online."
              : `${queuedCount} offline review${queuedCount === 1 ? "" : "s"} waiting to sync.`}
          </div>
        )}

        {submitError && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {submitError}
          </div>
        )}

        <section className="flex justify-center">
          <motion.div
            key={current.id}
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={cardMotion(motionGrade)}
            exit={{ opacity: 0, x: 80 }}
            transition={{ type: "spring", stiffness: 280, damping: 24 }}
            className="w-full max-w-[720px]"
          >
            <div
              className="group relative h-[600px] pb-7 sm:h-[560px]"
              style={{ perspective: 1000 }}
              onTouchStart={onTouchStart}
              onTouchEnd={onTouchEnd}
              onTouchMove={onTouchMove}
              onTouchCancel={clearLongPress}
            >
              <div className="absolute inset-x-8 bottom-3 top-9 rounded-[1.35rem] border border-neutral-200/70 bg-white/80 shadow-[0_18px_55px_rgba(15,23,42,0.08)]" />
              <div className="absolute inset-x-14 bottom-0 top-16 rounded-[1.35rem] border border-neutral-200/60 bg-white/55 shadow-[0_14px_40px_rgba(15,23,42,0.06)]" />
              <motion.button
                type="button"
                onClick={() => {
                  if (!isMcq || selectedMcq || reveal) onReveal();
                }}
                disabled={reveal || (isMcq && !selectedMcq)}
                whileTap={{ scale: 0.985 }}
                className="absolute inset-x-0 top-0 z-10 h-[calc(100%-2rem)] w-full rounded-[1.35rem] text-left outline-none [transform-style:preserve-3d] disabled:cursor-default"
                animate={{ rotateY: reveal ? 180 : 0 }}
                transition={{ type: "spring", stiffness: 220, damping: 24, mass: 0.9 }}
                style={{ transformStyle: "preserve-3d" }}
              >
                <CardFace
                  side="front"
                  card={current}
                  reveal={false}
                  selectedMcq={selectedMcq}
                  onSelectMcq={(option) => {
                    setSelectedMcq(option);
                    setAnswer(`${option.label}. ${option.text}`);
                  }}
                />
                <CardFace
                  side="back"
                  card={current}
                  reveal
                  selectedMcq={selectedMcq}
                  onSelectMcq={(option) => {
                    setSelectedMcq(option);
                    setAnswer(`${option.label}. ${option.text}`);
                  }}
                  grader={grader}
                  graderLoading={graderLoading}
                />
              </motion.button>
            </div>
          </motion.div>
        </section>

        {!reveal && !isMcq && (
          <div className="mx-auto max-w-[720px] space-y-3">
            <label className="text-[11px] font-medium uppercase tracking-wider text-neutral-500">
              Your recall
            </label>
            <textarea
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              rows={2}
              placeholder="Type what you remember, then press Space to reveal"
              className="w-full resize-none rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm shadow-sm focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
        )}

        {!reveal && isMcq && (
          <div className="mx-auto max-w-[720px] text-center text-xs text-neutral-500">
            Select an option, then press Space or click the card to reveal.
          </div>
        )}

        <AnimatePresence>
          {reveal && controlsReady && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ type: "spring", stiffness: 320, damping: 26 }}
              className="grid grid-cols-2 gap-3 sm:grid-cols-4"
            >
              {([1, 2, 3, 4] as Grade[]).map((grade) => (
                <ConfidenceButton
                  key={grade}
                  grade={grade}
                  disabled={submitting}
                  onClick={() => submit(grade)}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

function CardFace({
  side,
  card,
  reveal,
  selectedMcq,
  onSelectMcq,
  grader,
  graderLoading,
}: {
  side: "front" | "back";
  card: DueCard;
  reveal: boolean;
  selectedMcq: FlashcardMcqOption | null;
  onSelectMcq: (option: FlashcardMcqOption) => void;
  grader?: { grade: Grade; rationale: string } | null;
  graderLoading?: boolean;
}) {
  const isBack = side === "back";
  return (
    <div
      className={`absolute inset-0 flex flex-col rounded-[1.35rem] border border-neutral-200/80 bg-white p-5 shadow-[0_24px_80px_rgba(15,23,42,0.10)] transition-shadow duration-300 [backface-visibility:hidden] sm:p-8 [@media(hover:hover)]:group-hover:shadow-[0_36px_100px_rgba(15,23,42,0.14)] ${
        isBack ? "[transform:rotateY(180deg)]" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-2">
          <span className="inline-flex rounded-md bg-primary/[0.08] px-3 py-1 text-[11px] font-medium uppercase tracking-wider text-primary">
            {card.type.replace("_", " ")}
          </span>
          <span className="ml-2 inline-flex rounded-md bg-neutral-100 px-2.5 py-1 text-[11px] font-medium uppercase tracking-wider text-neutral-500">
            {FORMAT_LABEL[card.format]}
          </span>
        </div>
        <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-wider text-neutral-500">
          <span className={`h-2 w-2 rounded-full ${isBack ? "bg-emerald-500" : "bg-primary"}`} />
          {isBack ? "Back" : "Front"}
        </div>
      </div>

      {card.context && (
        <p className="mt-5 rounded-xl border border-info/15 bg-info/[0.06] px-4 py-3 text-sm leading-relaxed text-neutral-600">
          {card.context}
        </p>
      )}

      <div className="flex min-h-0 flex-1 items-center justify-center py-6">
        {isBack ? (
          <div className="max-h-full w-full space-y-4 overflow-y-auto">
            {card.format === "mcq" && card.mcq_options?.length ? (
              <McqCard
                front={card.front}
                options={card.mcq_options}
                selectedLabel={selectedMcq?.label ?? null}
                revealed={reveal}
                onSelect={onSelectMcq}
              />
            ) : (
              <p className="text-center font-poppins text-xl font-semibold leading-relaxed text-neutral-900 sm:text-3xl">
                {card.back}
              </p>
            )}
            {card.reasoning && (
              <div className="rounded-xl border border-info/15 bg-info/[0.06] p-4">
                <div className="text-[11px] font-medium uppercase tracking-wider text-info/80">
                  Why
                </div>
                <p className="mt-1 text-sm leading-relaxed text-neutral-700">{card.reasoning}</p>
              </div>
            )}
            {(graderLoading || grader) && (
              <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4 text-sm">
                {graderLoading ? (
                  <span className="text-info/80">Scoring your recall...</span>
                ) : grader ? (
                  <>
                    <div className="font-medium text-neutral-900">
                      Suggested: {GRADE_LABEL[grader.grade]}
                    </div>
                    {grader.rationale && (
                      <p className="mt-1 text-xs leading-relaxed text-neutral-600">
                        {grader.rationale}
                      </p>
                    )}
                  </>
                ) : null}
              </div>
            )}
          </div>
        ) : (
          <div className="max-h-full w-full overflow-y-auto">
            <CardFront card={card} selectedMcq={selectedMcq} onSelectMcq={onSelectMcq} />
          </div>
        )}
      </div>

      {!isBack && (
        <div className="flex items-center justify-center gap-2 text-xs text-neutral-400">
          <RotateCcw className="h-4 w-4" />
          {card.format === "mcq" ? "Choose an answer, then flip" : "Click or press Space to flip"}
        </div>
      )}
    </div>
  );
}

function CardFront({
  card,
  selectedMcq,
  onSelectMcq,
}: {
  card: DueCard;
  selectedMcq: FlashcardMcqOption | null;
  onSelectMcq: (option: FlashcardMcqOption) => void;
}) {
  if (card.format === "cloze") {
    return (
      <div className="text-center">
        <ClozeCard front={card.front} revealed={false} />
      </div>
    );
  }
  if (card.format === "mcq" && card.mcq_options?.length) {
    return (
      <McqCard
        front={card.front}
        options={card.mcq_options}
        selectedLabel={selectedMcq?.label ?? null}
        revealed={false}
        onSelect={onSelectMcq}
      />
    );
  }
  return (
    <p className="text-center font-poppins text-xl font-semibold leading-relaxed text-neutral-900 sm:text-3xl">
      {card.front}
    </p>
  );
}

function ConfidenceButton({
  grade,
  disabled,
  onClick,
}: {
  grade: Grade;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <motion.button
      type="button"
      disabled={disabled}
      onClick={onClick}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: "spring", stiffness: 420, damping: 20 }}
      className={`rounded-2xl border px-4 py-4 text-left shadow-sm transition-colors disabled:opacity-50 ${GRADE_STYLE[grade]}`}
    >
      <div className="flex items-center gap-3">
        <span className={`grid h-9 w-9 place-items-center rounded-full ${GRADE_DOT[grade]}`}>
          {grade === 1 ? "!" : grade === 2 ? "~" : grade === 3 ? <Check className="h-4 w-4" /> : <Award className="h-4 w-4" />}
        </span>
        <div>
          <div className="font-poppins text-base font-semibold">{GRADE_LABEL[grade]}</div>
          <div className="text-xs opacity-75">{GRADE_HINT[grade]}</div>
        </div>
      </div>
    </motion.button>
  );
}


function CompletionScreen({
  reviewedAny,
  tally,
  elapsedSeconds,
  retentionScore,
  online,
  queuedCount,
  onRefresh,
}: {
  reviewedAny: boolean;
  tally: { reviewed: number; again: number; hard: number; good: number; easy: number };
  elapsedSeconds: number;
  retentionScore: number;
  online: boolean;
  queuedCount: number;
  onRefresh: () => void;
}) {
  return (
    <div className="mx-auto flex max-w-3xl flex-col items-center justify-center py-16 text-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 18 }}
        className="relative grid h-20 w-20 place-items-center rounded-full bg-emerald-50 text-emerald-600"
      >
        <motion.span
          className="absolute inset-0 rounded-full border border-emerald-200"
          animate={{ scale: [1, 1.18], opacity: [0.8, 0] }}
          transition={{ repeat: 2, duration: 1.2 }}
        />
        <Check className="h-9 w-9" />
      </motion.div>
      <h2 className="mt-6 font-poppins text-3xl font-semibold text-neutral-900">
        {reviewedAny ? "Session complete" : "Nothing due"}
      </h2>
      <p className="mt-2 max-w-md text-sm text-neutral-500">
        {reviewedAny
          ? `You reviewed ${tally.reviewed} card${tally.reviewed === 1 ? "" : "s"} in ${formatDuration(elapsedSeconds)}.`
          : online
            ? "You're caught up. Generate a new deck or check back later."
            : "You're offline and no cached reviews are currently due on this device."}
      </p>

      {reviewedAny && (
        <div className="mt-8 grid w-full grid-cols-2 gap-3 sm:grid-cols-4">
          <CompletionStat label="Reviewed" value={tally.reviewed} />
          <CompletionStat label="Retention" value={`${retentionScore}%`} />
          <CompletionStat label="Again" value={tally.again} />
          <CompletionStat label="Easy" value={tally.easy} />
        </div>
      )}

      {queuedCount > 0 && (
        <p className="mt-5 text-xs text-info">
          {queuedCount} offline review{queuedCount === 1 ? "" : "s"} will sync when connection
          returns.
        </p>
      )}

      <div className="mt-8 flex justify-center gap-3">
        <Link
          href="/flashcards"
          className="rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary/90"
        >
          Back to flashcards
        </Link>
        <button
          onClick={onRefresh}
          className="rounded-lg border border-neutral-200 px-5 py-2.5 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50"
        >
          Check for more
        </button>
      </div>
    </div>
  );
}

function CompletionStat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-card">
      <div className="font-poppins text-2xl font-semibold text-neutral-900">{value}</div>
      <div className="mt-1 text-[11px] font-medium uppercase tracking-wider text-neutral-500">
        {label}
      </div>
    </div>
  );
}

function cardMotion(grade: Grade | null) {
  if (grade === 1) return { opacity: 1, x: [0, -9, 8, -5, 0], y: 0, scale: 1 };
  if (grade === 2) return { opacity: 1, x: 0, y: [0, 4, 0], scale: 0.99 };
  if (grade === 3) return { opacity: 0, x: 72, y: 0, scale: 0.99 };
  if (grade === 4) return { opacity: 0, x: 128, y: -8, scale: 1.02 };
  return { opacity: 1, x: 0, y: 0, scale: 1 };
}

function sessionTitle(card: DueCard) {
  const raw = card.type.replace("_", " ");
  return `${raw.charAt(0).toUpperCase()}${raw.slice(1)} • Review`;
}

function formatDuration(seconds: number) {
  const mins = Math.max(1, Math.round(seconds / 60));
  return `${mins} min`;
}

function isTypingTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  return ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName) || target.isContentEditable;
}
