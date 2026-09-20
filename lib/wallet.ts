"use client";

import { Keypair } from "@stellar/stellar-sdk";

/**
 * The participant's key, kept in this browser.
 *
 * A hackathon-grade wallet on purpose: no extension to install, no seed phrase
 * to write down — the point of the demo is that someone with only a banking app
 * can take part. The roadmap replaces this with a passkey smart account; until
 * then, clearing site data loses the key, which the UI says out loud.
 */
const STORAGE_KEY = "stello:key";

export function loadKeypair(): Keypair | null {
  if (typeof window === "undefined") return null;
  try {
    const secret = window.localStorage.getItem(STORAGE_KEY);
    return secret ? Keypair.fromSecret(secret) : null;
  } catch {
    return null;
  }
}

/** Returns the existing key, creating one on first use. */
export function getOrCreateKeypair(): Keypair {
  const existing = loadKeypair();
  if (existing) return existing;

  const keypair = Keypair.random();
  try {
    window.localStorage.setItem(STORAGE_KEY, keypair.secret());
  } catch {
    // Private mode or blocked storage: the key still works for this session.
  }
  return keypair;
}

export function forgetKeypair(): void {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Nothing to forget.
  }
}

/**
 * Nudges Stello's hosted relay so a pledge lands without waiting for its next
 * pass. This app never holds the landing key — the relay runs on Stello's side,
 * and its origin must allow ours. Failures are not fatal: the relay's own loop
 * picks the payment up anyway.
 */
export async function triggerRelay(): Promise<void> {
  const url = process.env.NEXT_PUBLIC_STELLO_RELAY_URL;
  if (!url) return;
  try {
    await fetch(url, { method: "POST", mode: "cors" });
  } catch {
    // Offline, blocked by CORS, or the relay is down — the loop still has it.
  }
}
