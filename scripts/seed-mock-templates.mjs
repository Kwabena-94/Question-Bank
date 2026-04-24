#!/usr/bin/env node
/**
 * Seed fixed mock templates (Mock 1 = 115Q, Mock 2 = 230Q).
 *
 * Strategy: sample question IDs from each specialty in proportion to its
 * share of the published pool. Deterministic given the current DB — but
 * idempotent via template `slug`, so re-runs leave existing templates
 * untouched (they are not overwritten; edit manually if you need to
 * rotate the question set).
 */

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const SPECIALTIES = ["medicine", "obgyn", "peds", "pop_health", "psych", "surgery"];

function shuffle(arr) {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

async function sampleQuestions(sb, total) {
  // Count pool per specialty
  const pool = {};
  let grand = 0;
  for (const s of SPECIALTIES) {
    const { data, error } = await sb
      .from("questions")
      .select("id")
      .eq("is_published", true)
      .eq("clinical_specialty", s);
    if (error) throw new Error(error.message);
    pool[s] = data.map((r) => r.id);
    grand += data.length;
  }
  if (grand < total) {
    throw new Error(`Not enough questions (${grand}) to seed ${total}`);
  }

  // Proportional quota (floor), then top up largest remainders
  const quotas = {};
  const remainders = [];
  let assigned = 0;
  for (const s of SPECIALTIES) {
    const share = (pool[s].length / grand) * total;
    const floor = Math.floor(share);
    quotas[s] = floor;
    remainders.push([s, share - floor]);
    assigned += floor;
  }
  remainders.sort((a, b) => b[1] - a[1]);
  let i = 0;
  while (assigned < total) {
    quotas[remainders[i % remainders.length][0]] += 1;
    assigned += 1;
    i += 1;
  }

  const picked = [];
  const distribution = {};
  for (const s of SPECIALTIES) {
    const take = quotas[s];
    distribution[s] = take;
    picked.push(...shuffle(pool[s]).slice(0, take));
  }
  return { ids: shuffle(picked), distribution };
}

async function upsertTemplate(sb, {
  slug,
  title,
  description,
  type,
  question_count,
  duration_minutes,
}) {
  const existing = await sb
    .from("mock_templates")
    .select("id, question_ids")
    .eq("slug", slug)
    .maybeSingle();

  if (existing.data?.question_ids?.length) {
    console.log(`  ${slug}: exists (${existing.data.question_ids.length} Q) — skipping`);
    return existing.data.id;
  }

  const { ids, distribution } = await sampleQuestions(sb, question_count);

  if (existing.data) {
    const { error } = await sb
      .from("mock_templates")
      .update({
        title,
        description,
        type,
        question_count,
        duration_minutes,
        question_ids: ids,
        domain_distribution: distribution,
        is_published: true,
      })
      .eq("id", existing.data.id);
    if (error) throw new Error(error.message);
    console.log(`  ${slug}: updated (${ids.length} Q)`);
    return existing.data.id;
  }

  const { data, error } = await sb
    .from("mock_templates")
    .insert({
      slug,
      title,
      description,
      type,
      question_count,
      duration_minutes,
      question_ids: ids,
      domain_distribution: distribution,
      is_published: true,
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  console.log(`  ${slug}: created (${ids.length} Q)`);
  return data.id;
}

async function main() {
  const sb = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { persistSession: false },
  });

  console.log("Seeding mock templates…");

  await upsertTemplate(sb, {
    slug: "mock-1-short",
    title: "Mock 1 — Short",
    description: "115-question timed mock sampling all six specialties.",
    type: "timed",
    question_count: 115,
    duration_minutes: 160,
  });

  await upsertTemplate(sb, {
    slug: "mock-2-full",
    title: "Mock 2 — Full Length",
    description: "Full 230-question timed mock matching MCCQE1 exam length.",
    type: "timed",
    question_count: 230,
    duration_minutes: 240,
  });

  console.log("Done.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
