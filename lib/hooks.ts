"use client";

import { campaignView, listCampaigns, type CampaignView, type StepName } from "./campaign";
import { useCallback, useEffect, useRef, useState } from "react";

import { getOrCreateKeypair, loadKeypair } from "./wallet.ts";

/**
 * Thin data layer. The campaign logic lives in lib/campaign and the payment rail in stello-sdk; these hooks
 * only decide when to call it and what the screen knows while it runs.
 */

/** The browser key, created lazily so a visitor who only looks costs nothing. */
export function useWallet() {
  const [address, setAddress] = useState<string | null>(null);

  useEffect(() => {
    setAddress(loadKeypair()?.publicKey() ?? null);
  }, []);

  const ensureKeypair = useCallback(() => {
    const keypair = getOrCreateKeypair();
    setAddress(keypair.publicKey());
    return keypair;
  }, []);

  return { address, ensureKeypair };
}

/** Polls one campaign so the counter moves while people are paying. */
export function useCampaign(id: bigint | null, intervalMs = 3000) {
  const { address } = useWallet();
  const [view, setView] = useState<CampaignView | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id === null) return;
    let cancelled = false;

    const poll = async () => {
      try {
        const next = await campaignView(id, address ?? undefined);
        if (!cancelled) {
          setView(next);
          setError(null);
        }
      } catch (cause) {
        if (!cancelled) setError(cause instanceof Error ? cause.message : String(cause));
      }
    };

    void poll();
    const timer = setInterval(poll, intervalMs);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [id, address, intervalMs]);

  return { view, error };
}

export function useCampaignList(intervalMs = 5000) {
  const [campaigns, setCampaigns] = useState<CampaignView[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    const poll = async () => {
      const next = await listCampaigns().catch(() => null);
      if (!cancelled && next) setCampaigns(next);
    };
    void poll();
    const timer = setInterval(poll, intervalMs);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [intervalMs]);

  return campaigns;
}

/**
 * Runs one of the core flows while exposing where it is, so the screen can show
 * a step instead of a spinner. Double submission is blocked; every flow is
 * re-entrant, so a failed one can simply be run again.
 */
export function useFlow<T>() {
  const [step, setStep] = useState<{ name: StepName; detail?: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const running = useRef(false);
  const [busy, setBusy] = useState(false);

  const run = useCallback(async (flow: (onStep: (name: StepName, detail?: string) => void) => Promise<T>) => {
    if (running.current) return null;
    running.current = true;
    setBusy(true);
    setError(null);

    try {
      return await flow((name, detail) => setStep({ name, detail }));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
      return null;
    } finally {
      running.current = false;
      setBusy(false);
      setStep(null);
    }
  }, []);

  return { run, step, busy, error, clearError: () => setError(null) };
}
