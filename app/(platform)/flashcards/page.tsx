import type { Metadata } from "next";
import { requireAuth } from "@/lib/auth";
import FlashcardFlow from "@/components/flashcards/FlashcardFlow";

export const metadata: Metadata = { title: "Flashcards — MedBuddy" };

export default async function FlashcardsPage() {
  await requireAuth();
  return <FlashcardFlow />;
}
