"use client";

import { useEffect, useState } from "react";

interface BillingResponse {
  subscription: {
    plan: string;
    status: string;
    licensePaid: boolean;
    maxSeats: number;
    currentPeriodEnd: string | null;
    cancelAtPeriodEnd: boolean;
  } | null;
  trialProjectsRemaining: number | null;
  canUpload: boolean;
}

interface GateState {
  /** True when trial user has used their free project and has no active subscription */
  isGated: boolean;
  /** Still loading billing data */
  isLoading: boolean;
  /** Raw subscription data */
  subscription: BillingResponse["subscription"];
  /** Number of trial projects remaining (null if subscribed) */
  trialProjectsRemaining: number | null;
  /** True if org has active paid subscription (can upload own documents) */
  canUpload: boolean;
}

export function useGate(): GateState {
  const [data, setData] = useState<BillingResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    fetch("/api/billing")
      .then((res) => (res.ok ? res.json() : null))
      .then((d) => {
        if (!cancelled && d) setData(d);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const subscription = data?.subscription ?? null;
  const trialProjectsRemaining = data?.trialProjectsRemaining ?? null;

  // Gated = on trial + 0 projects remaining + no active subscription
  const hasActiveSub =
    subscription !== null &&
    subscription.status === "active" &&
    subscription.plan !== "trial";

  const isGated =
    !isLoading &&
    !hasActiveSub &&
    trialProjectsRemaining !== null &&
    trialProjectsRemaining === 0;

  const canUpload = data?.canUpload ?? false;

  return { isGated, isLoading, subscription, trialProjectsRemaining, canUpload };
}
