"use server";

/**
 * Auth service — all auth calls go through here, never directly to Supabase.
 * Swap the provider by replacing the implementations below; callers don't change.
 */

import { createClient, createServiceClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { Profile } from "@/types";

export async function getSession() {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}

export async function getUser() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;
  return user;
}

export async function getProfile(): Promise<Profile | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return data ?? null;
}

export async function requireAuth() {
  const user = await getUser();
  if (!user) redirect("/login");
  return user;
}

export async function signInWithEmail(email: string, password: string) {
  const supabase = await createClient();
  return supabase.auth.signInWithPassword({ email, password });
}

export async function signUpWithEmail(email: string, password: string, fullName: string) {
  const supabase = await createClient();
  return supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName } },
  });
}

/**
 * Exchange a Teachable authorization code for a Supabase session.
 *
 * Flow: verify code with Teachable → fetch Teachable user → ensure a
 * passwordless Supabase user exists for that email → generate a one-shot
 * magic-link → return the link's verification URL for the caller to
 * redirect the browser to. Supabase sets the session cookie on visit.
 *
 * No passwords are ever stored or derived, which removes the prior risk of
 * an attacker who learns TEACHABLE_CLIENT_SECRET forging anyone's account.
 */
export async function signInWithTeachable(code: string): Promise<string> {
  const tokenRes = await fetch(`${process.env.TEACHABLE_SITE_URL}/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      code,
      client_id: process.env.TEACHABLE_CLIENT_ID,
      client_secret: process.env.TEACHABLE_CLIENT_SECRET,
      grant_type: "authorization_code",
      redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/auth/teachable/callback`,
    }),
  });
  if (!tokenRes.ok) throw new Error("Teachable token exchange failed");
  const token: { access_token: string } = await tokenRes.json();

  const userRes = await fetch(`${process.env.TEACHABLE_SITE_URL}/api/v1/users/me`, {
    headers: { Authorization: `Bearer ${token.access_token}` },
  });
  if (!userRes.ok) throw new Error("Teachable user lookup failed");
  const teachableUser: { id: number | string; email: string; name?: string } =
    await userRes.json();
  if (!teachableUser?.email) throw new Error("Teachable did not return an email");

  const admin = await createServiceClient();

  // Ensure a Supabase user exists for this Teachable identity. Supabase
  // returns a 422 when the user already exists — we treat that as a no-op
  // and proceed to generate a link.
  const { error: createErr } = await admin.auth.admin.createUser({
    email: teachableUser.email,
    email_confirm: true,
    user_metadata: {
      full_name: teachableUser.name ?? null,
      teachable_user_id: String(teachableUser.id),
      provider: "teachable",
    },
  });
  if (createErr && !/already\s+registered|exists/i.test(createErr.message)) {
    throw new Error(`Could not provision user: ${createErr.message}`);
  }

  const { data, error: linkErr } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email: teachableUser.email,
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback?next=/home`,
    },
  });
  if (linkErr || !data?.properties?.action_link) {
    throw new Error(linkErr?.message ?? "Could not create login link");
  }
  return data.properties.action_link;
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
