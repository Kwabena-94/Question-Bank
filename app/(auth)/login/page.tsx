import { Metadata } from "next";
import LoginForm from "@/components/auth/LoginForm";

export const metadata: Metadata = { title: "Sign In — MedCognito" };

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-neutral-100 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-2">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
              <span className="text-white font-poppins font-bold text-base">M</span>
            </div>
            <span className="font-poppins font-bold text-lg text-neutral-900">
              Med<span className="text-primary">Cognito</span>
            </span>
          </div>
          <p className="text-sm text-neutral-500">Together Towards Success</p>
        </div>

        <div className="card-surface p-8">
          <h1 className="font-poppins text-2xl font-semibold text-neutral-900 mb-1">
            Welcome back
          </h1>
          <p className="text-sm text-neutral-500 mb-6">
            Sign in to continue your exam prep
          </p>
          <LoginForm />
        </div>

        <p className="text-center text-sm text-neutral-500 mt-4">
          Don&apos;t have an account?{" "}
          <a href="/signup" className="text-primary font-medium hover:underline">
            Sign up
          </a>
        </p>
      </div>
    </main>
  );
}
