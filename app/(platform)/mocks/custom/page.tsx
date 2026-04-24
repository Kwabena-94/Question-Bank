import Link from "next/link";
import { Metadata } from "next";
import { requireAuth } from "@/lib/auth";
import CustomMockForm from "@/components/mocks/CustomMockForm";

export const metadata: Metadata = { title: "Custom mock — MedBuddy" };

export default async function CustomMockPage() {
  await requireAuth();

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <Link
        href="/mocks"
        className="text-sm text-neutral-500 hover:text-neutral-700"
      >
        ← Back to mocks
      </Link>

      <div>
        <h1 className="font-poppins text-2xl font-semibold text-neutral-900">
          Build a custom quiz
        </h1>
        <p className="text-sm text-neutral-500 mt-1">
          Pick the length, specialties, and difficulty. Time prorates at ~1.4 min
          per question.
        </p>
      </div>

      <CustomMockForm />
    </div>
  );
}
