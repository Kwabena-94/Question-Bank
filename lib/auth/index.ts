"use server";

/**
 * Auth service — all auth calls go through here, never directly to Supabase.
 * Swap the provider by replacing the implementations below; callers don't change.
 */

import { createClient } from "@/lib/supabase/server";
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

export async function signInWithTeachable(code: string) {
  // Teachable OAuth callback handler
  // Exchange code for token via Teachable API, then upsert user into Supabase
  const supabase = await createClient();
  const res = await fetch(`${process.env.TEACHABLE_SITE_URL}/oauth/token`, {
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

  if (!res.ok) throw new Error("Teachable token exchange failed");
  const token = await res.json();

  // Fetch Teachable user info
  const userRes = await fetch(`${process.env.TEACHABLE_SITE_URL}/api/v1/users/me`, {
    headers: { Authorization: `Bearer ${token.access_token}` },
  });
  const teachableUser = await userRes.json();

  // Sign in / create Supabase user linked to Teachable identity
  return supabase.auth.signInWithPassword({
    email: teachableUser.email,
    password: teachableUser.id.toString() + process.env.TEACHABLE_CLIENT_SECRET,
  });
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
