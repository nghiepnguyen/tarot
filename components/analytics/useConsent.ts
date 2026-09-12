"use client";

import { useSyncExternalStore } from "react";
import {
  getConsentSnapshot,
  getServerConsentSnapshot,
  subscribeConsent,
  type ConsentState,
} from "@/lib/analytics/consent";

export function useConsent(): ConsentState {
  return useSyncExternalStore(
    subscribeConsent,
    getConsentSnapshot,
    getServerConsentSnapshot,
  );
}
