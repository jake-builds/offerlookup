"use client";

import { track } from "@vercel/analytics";

type AnalyticsEvent =
  | "cta_clicked"
  | "offer_edited"
  | "offer_saved"
  | "offer_removed"
  | "offers_sorted";

type AnalyticsProperties = Record<string, string | number | boolean>;

export function trackProductEvent(
  event: AnalyticsEvent,
  properties: AnalyticsProperties = {},
) {
  track(event, {
    app: "offerlookup",
    ...properties,
  });
}
