// lib/flashcards/cwc.ts
//
// Choosing Wisely Canada (CWC) grounding — pulls specialty-specific
// recommendations and injects them as a per-request system block.
//
// Cache lives in Supabase (cwc_cache) with a 24h soft TTL so cold serverless
// instances reuse warm scrapes. Failure modes are silent: if the scrape or
// cache lookup fails, generation proceeds without grounding.

import type { SupabaseClient } from "@supabase/supabase-js";

const CWC_CACHE_TTL_MS = 24 * 60 * 60 * 1000;

// Topic → specialty slug used in CWC URLs.
const CWC_TOPIC_MAP: Record<string, string> = {
  "atrial fibrillation": "cardiology",
  "heart failure": "cardiology",
  "chest pain": "cardiology",
  "hypertension": "cardiology",
  "coronary artery disease": "cardiology",
  "acute coronary syndrome": "cardiology",
  "echocardiogram": "cardiology",
  "statin": "cardiology",
  "emergency": "emergency-medicine",
  "trauma": "emergency-medicine",
  "syncope": "emergency-medicine",
  "dizziness": "emergency-medicine",
  "headache": "emergency-medicine",
  "diabetes": "endocrinology-and-metabolism",
  "thyroid": "endocrinology-and-metabolism",
  "hyperthyroidism": "endocrinology-and-metabolism",
  "hypothyroidism": "endocrinology-and-metabolism",
  "adrenal": "endocrinology-and-metabolism",
  "cushing": "endocrinology-and-metabolism",
  "osteoporosis": "endocrinology-and-metabolism",
  "screening": "family-medicine",
  "prevention": "family-medicine",
  "gastrointestinal": "gastroenterology",
  "colonoscopy": "gastroenterology",
  "irritable bowel": "gastroenterology",
  "crohn": "gastroenterology",
  "ulcerative colitis": "gastroenterology",
  "gerd": "gastroenterology",
  "hepatitis": "hepatology",
  "cirrhosis": "hepatology",
  "dementia": "geriatrics",
  "fall": "geriatrics",
  "delirium": "geriatrics",
  "elderly": "geriatrics",
  "frail": "geriatrics",
  "anemia": "hematology",
  "thrombosis": "hematology",
  "dvt": "hematology",
  "pulmonary embolism": "hematology",
  "anticoagul": "hematology",
  "warfarin": "hematology",
  "hospital": "hospital-medicine",
  "sepsis": "hospital-medicine",
  "antibiotic": "infectious-disease",
  "infection": "infectious-disease",
  "pneumonia": "infectious-disease",
  "uti": "infectious-disease",
  "cellulitis": "infectious-disease",
  "hiv": "infectious-disease",
  "kidney": "nephrology",
  "renal": "nephrology",
  "ckd": "nephrology",
  "dialysis": "nephrology",
  "proteinuria": "nephrology",
  "stroke": "neurology",
  "tia": "neurology",
  "seizure": "neurology",
  "epilepsy": "neurology",
  "multiple sclerosis": "neurology",
  "parkinson": "neurology",
  "obstetric": "obstetrics-and-gynaecology",
  "pregnancy": "obstetrics-and-gynaecology",
  "prenatal": "obstetrics-and-gynaecology",
  "labour": "obstetrics-and-gynaecology",
  "postpartum": "obstetrics-and-gynaecology",
  "pap smear": "obstetrics-and-gynaecology",
  "cancer": "oncology",
  "chemotherapy": "oncology",
  "child": "paediatrics",
  "infant": "paediatrics",
  "newborn": "paediatrics",
  "paediatric": "paediatrics",
  "pediatric": "paediatrics",
  "depression": "psychiatry",
  "anxiety": "psychiatry",
  "bipolar": "psychiatry",
  "schizophrenia": "psychiatry",
  "psychosis": "psychiatry",
  "mental health": "psychiatry",
  "adhd": "psychiatry",
  "opioid": "addiction-medicine",
  "asthma": "respirology",
  "copd": "respirology",
  "respiratory": "respirology",
  "arthritis": "rheumatology",
  "lupus": "rheumatology",
  "gout": "rheumatology",
  "appendix": "general-surgery",
  "surgical": "general-surgery",
};

export function detectCwcSpecialty(topic: string): string | null {
  const lower = topic.toLowerCase();
  for (const [keyword, specialty] of Object.entries(CWC_TOPIC_MAP)) {
    if (lower.includes(keyword)) return specialty;
  }
  return null;
}

async function fetchCwcFromWeb(specialty: string): Promise<string | null> {
  try {
    const res = await fetch(
      `https://choosingwiselycanada.org/recommendation/${specialty}/`,
      {
        headers: { "User-Agent": "MedCognito-Educational-Bot/1.0" },
        signal: AbortSignal.timeout(4000),
      }
    );
    if (!res.ok) return null;

    const html = await res.text();
    const match = html.match(
      /<div[^>]+class="[^"]*entry-content[^"]*"[^>]*>([\s\S]*?)<\/div>/i
    );
    if (!match) return null;

    return match[1]
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s{2,}/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&#8217;/g, "'")
      .replace(/&nbsp;/g, " ")
      .trim()
      .slice(0, 3000);
  } catch {
    return null;
  }
}

export async function getCwcContext(
  service: SupabaseClient,
  topic: string
): Promise<string | null> {
  const specialty = detectCwcSpecialty(topic);
  if (!specialty) return null;

  // Try the cache first.
  const { data: cached } = await service
    .from("cwc_cache")
    .select("body, fetched_at")
    .eq("specialty", specialty)
    .maybeSingle();

  let body: string | null = null;
  if (cached) {
    const ageMs = Date.now() - new Date(cached.fetched_at).getTime();
    if (ageMs < CWC_CACHE_TTL_MS) body = cached.body;
  }

  // Stale or missing → re-fetch (and write back). Don't await the write.
  if (!body) {
    body = await fetchCwcFromWeb(specialty);
    if (body) {
      void service
        .from("cwc_cache")
        .upsert({ specialty, body, fetched_at: new Date().toISOString() });
    }
  }

  if (!body) return null;
  return (
    `CHOOSING WISELY CANADA ${specialty.replace(/-/g, " ").toUpperCase()} RECOMMENDATIONS: ` +
    body
  );
}
