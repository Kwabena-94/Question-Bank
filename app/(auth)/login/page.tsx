import { Metadata } from "next";
import Image from "next/image";
import LoginForm from "@/components/auth/LoginForm";

export const metadata: Metadata = { title: "Sign In — MedBuddy" };

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-neutral-100 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <Image
            src="/logos/logo-02.png"
            alt="MedBuddy"
            width={480}
            height={120}
            priority
            className="h-28 w-auto"
          />
        </div>

        <div className="card-surface p-8">
          <h1 className="font-poppins text-2xl font-semibold text-neutral-900 mb-1">
            Welcome
          </h1>
          <p className="text-sm text-neutral-500 mb-6">
            Enter your email and we&apos;ll send you a magic link to sign in.
          </p>
          <LoginForm />
        </div>

        <p className="text-center text-xs text-neutral-500 mt-4">
          New to MedBuddy? Just enter your email — we&apos;ll create your account.
        </p>
      </div>
    </main>
  );
}
