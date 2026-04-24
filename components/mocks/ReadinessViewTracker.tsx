"use client";

import { useEffect } from "react";
import { track } from "@/lib/analytics/track";

export default function ReadinessViewTracker({ tier }: { tier: string }) {
  useEffect(() => {
    track.readinessViewed(tier);
  }, [tier]);
  return null;
}
