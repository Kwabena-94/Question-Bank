#!/usr/bin/env node
/**
 * Seed published questions from jsonFile.js into Supabase.
 *
 * Usage:
 *   NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... \
 *     node scripts/seed-questions.mjs
 *
 * Idempotent: uses a stable source_reference per question so re-runs upsert.
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SOURCE = resolve(__dirname, "..", "jsonFile.js");

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const SPECIALTY_MAP = {
  medicine: "medicine",
  obgyn: "obgyn",
  peds: "peds",
  pophealth: "pop_health",
  psych: "psych",
  surgery: "surgery",
};

function parseSource() {
  const raw = readFileSync(SOURCE, "utf8");
  const json = raw.replace(/^\s*window\.jsonFile\s*=\s*/, "").replace(/;\s*$/, "");
  return JSON.parse(json);
}

/**
 * Options in source are strings like "a)   Crohn's disease".
 * Normalize to { key, text } objects.
 */
function normalizeOptions(options) {
  return options.map((raw) => {
    const match = raw.match(/^\s*([a-eA-E])\s*[\)\.\:]\s*(.*)$/);
    if (match) {
      return { key: match[1].toLowerCase(), text: match[2].trim() };
    }
    return { key: null, text: raw.trim() };
  });
}

function sourceRefFor(specialty, content) {
  const hash = createHash("sha1").update(content).digest("hex").slice(0, 16);
  return `legacy:${specialty}:${hash}`;
}

function toRow(specialty, raw) {
  const options = normalizeOptions(raw.options ?? []);
  const correct = String(raw.correct ?? "").trim().toLowerCase();
  return {
    content: (raw.content ?? "").trim(),
    options,
    correct_option: correct,
    explanation: (raw.explanation ?? "").trim(),
    clinical_specialty: SPECIALTY_MAP[specialty],
    is_published: true,
    ingestion_source: "import",
    ingestion_metadata: { source: "legacy_jsonFile", specialty },
    source_reference: sourceRefFor(specialty, raw.content ?? ""),
  };
}

async function main() {
  const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { persistSession: false },
  });

  const data = parseSource();
  const rows = [];
  const seenRefs = new Set();
  let dupeCount = 0;
  for (const [specialty, items] of Object.entries(data)) {
    if (!SPECIALTY_MAP[specialty]) {
      console.warn(`Skipping unknown specialty: ${specialty}`);
      continue;
    }
    for (const item of items) {
      const row = toRow(specialty, item);
      // Guard: drop rows missing required fields
      if (!row.content || !row.explanation || !row.correct_option) continue;
      if (!["a", "b", "c", "d", "e"].includes(row.correct_option)) continue;
      // Drop questions with malformed options (e.g. table-data leakage)
      if (!row.options.length || row.options.some((o) => !o.key)) continue;
      // Correct answer must reference an existing option key
      if (!row.options.some((o) => o.key === row.correct_option)) continue;
      if (seenRefs.has(row.source_reference)) {
        dupeCount += 1;
        continue;
      }
      seenRefs.add(row.source_reference);
      rows.push(row);
    }
  }

  console.log(`Prepared ${rows.length} rows (deduped ${dupeCount}). Upserting in batches…`);

  const BATCH = 500;
  let inserted = 0;
  for (let i = 0; i < rows.length; i += BATCH) {
    const batch = rows.slice(i, i + BATCH);
    const { error, count } = await supabase
      .from("questions")
      .upsert(batch, { onConflict: "source_reference", count: "exact" });
    if (error) {
      console.error(`Batch ${i / BATCH} failed:`, error.message);
      process.exit(1);
    }
    inserted += count ?? batch.length;
    console.log(`  ${Math.min(i + BATCH, rows.length)}/${rows.length}`);
  }

  console.log(`Done. Upserted ${inserted} questions.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
