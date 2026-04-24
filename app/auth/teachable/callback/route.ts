import { NextResponse, type NextRequest } from "next/server";
import { signInWithTeachable } from "@/lib/auth";

/**
 * Teachable OAuth landing endpoint. Teachable redirects here with ?code=...
 * after the user approves the app on their side. We exchange the code for
 * a one-shot Supabase magic link and redirect the browser to it — that link
 * establishes the Supabase session and then bounces through /auth/callback
 * to /home.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=missing_code`);
  }

  try {
    const actionLink = await signInWithTeachable(code);
    return NextResponse.redirect(actionLink);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Teachable sign-in failed";
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(msg)}`
    );
  }
}
