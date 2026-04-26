import type { CardFormat, FlashcardMcqOption, Grade } from "@/types";

const DB_NAME = "medbuddy-flashcards";
const DB_VERSION = 1;
const DUE_STORE = "due_cards";
const REVIEW_STORE = "queued_reviews";

export interface OfflineDueCard {
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

export interface QueuedReview {
  id: string;
  card_id: string;
  grade: Grade;
  answer_text?: string;
  grader_suggestion?: Grade;
  queued_at: string;
}

function canUseIndexedDb() {
  return typeof window !== "undefined" && "indexedDB" in window;
}

function openDb(): Promise<IDBDatabase | null> {
  if (!canUseIndexedDb()) return Promise.resolve(null);
  return new Promise((resolve) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(DUE_STORE)) {
        db.createObjectStore(DUE_STORE, { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains(REVIEW_STORE)) {
        db.createObjectStore(REVIEW_STORE, { keyPath: "id" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => resolve(null);
  });
}

export async function cacheDueCards(cards: OfflineDueCard[]) {
  const db = await openDb();
  if (!db) return;
  await new Promise<void>((resolve) => {
    const tx = db.transaction(DUE_STORE, "readwrite");
    const store = tx.objectStore(DUE_STORE);
    for (const card of cards) store.put(card);
    tx.oncomplete = () => resolve();
    tx.onerror = () => resolve();
  });
  db.close();
}

export async function queueReview(review: Omit<QueuedReview, "id" | "queued_at">) {
  const db = await openDb();
  if (!db) return;
  const queued: QueuedReview = {
    ...review,
    id: `${review.card_id}:${Date.now()}:${Math.random().toString(36).slice(2)}`,
    queued_at: new Date().toISOString(),
  };
  await new Promise<void>((resolve) => {
    const tx = db.transaction(REVIEW_STORE, "readwrite");
    tx.objectStore(REVIEW_STORE).put(queued);
    tx.oncomplete = () => resolve();
    tx.onerror = () => resolve();
  });
  db.close();
}

export async function getQueuedReviewCount(): Promise<number> {
  const db = await openDb();
  if (!db) return 0;
  const count = await new Promise<number>((resolve) => {
    const tx = db.transaction(REVIEW_STORE, "readonly");
    const req = tx.objectStore(REVIEW_STORE).count();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => resolve(0);
  });
  db.close();
  return count;
}

export async function flushQueuedReviews(): Promise<number> {
  const db = await openDb();
  if (!db) return 0;
  const queued = await new Promise<QueuedReview[]>((resolve) => {
    const tx = db.transaction(REVIEW_STORE, "readonly");
    const req = tx.objectStore(REVIEW_STORE).getAll();
    req.onsuccess = () => resolve(req.result as QueuedReview[]);
    req.onerror = () => resolve([]);
  });

  let flushed = 0;
  for (const review of queued) {
    const res = await fetch("/api/flashcards/review", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        card_id: review.card_id,
        grade: review.grade,
        answer_text: review.answer_text,
        grader_suggestion: review.grader_suggestion,
      }),
    });
    if (!res.ok) break;
    await new Promise<void>((resolve) => {
      const tx = db.transaction(REVIEW_STORE, "readwrite");
      tx.objectStore(REVIEW_STORE).delete(review.id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
    flushed += 1;
  }
  db.close();
  return flushed;
}
