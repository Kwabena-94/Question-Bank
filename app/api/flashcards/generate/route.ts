import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient, createServiceClient } from "@/lib/supabase/server";

const eventSchema = z.object({
  event_name: z.string().min(1).max(100),
  module: z.string().max(100).optional(),
  topic: z.string().max(200).optional(),
  source: z.string().max(100).optional(),
  session_id: z.string().max(200).optional(),
  payload: z.record(z.any()).optional(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = eventSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid analytics payload" },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const admin = await createServiceClient();
    const { error } = await admin.from("analytics_events").insert({
      user_id: user?.id ?? null,
      event_name: parsed.data.event_name,
      module: parsed.data.module,
      topic: parsed.data.topic,
      source: parsed.data.source,
      session_id: parsed.data.session_id,
      payload: parsed.data.payload ?? {},
    });

    if (error) {
      return NextResponse.json(
        { error: "Failed to persist analytics event" },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
