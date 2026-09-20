import { fromStroops } from "stello-sdk";
import { Status, type CampaignView } from "@/lib/campaign";
import type { Copy } from "@/lib/copy";

/** "12.5" rather than "12.5000000"; two decimals is what a person reads as money. */
export function fmtUsdc(stroops: bigint, locale = "tr-TR"): string {
  const value = Number(fromStroops(stroops));
  return value.toLocaleString(locale, { maximumFractionDigits: 2 });
}

export function shortAddr(address: string): string {
  return `${address.slice(0, 4)}…${address.slice(-4)}`;
}

/** "3 gün 4 sa", "18 dk", "42 sn" — never a raw timestamp. */
export function timeLeft(seconds: number, t: Copy["format"]): string {
  if (seconds <= 0) return t.over;
  const days = Math.floor(seconds / 86_400);
  const hours = Math.floor((seconds % 86_400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (days) return `${days} ${t.day} ${hours} ${t.hour}`;
  if (hours) return `${hours} ${t.hour} ${minutes} ${t.minute}`;
  if (minutes) return `${minutes} ${t.minute}`;
  return `${seconds} ${t.second}`;
}

export type Verdict = { text: string; kind: "ok" | "no" | "rule" };

/** One word for where a campaign stands, and whether it is good news. */
export function verdictOf(campaign: CampaignView, t: Copy["verdict"]): Verdict {
  if (campaign.status === Status.Succeeded) return { text: t.succeeded, kind: "ok" };
  if (campaign.status === Status.Failed) return { text: t.failed, kind: "no" };
  // Still open on-chain but past its deadline: the first claim or settle closes it.
  if (campaign.secondsLeft === 0) {
    return campaign.total >= campaign.goal
      ? { text: t.succeeded, kind: "ok" }
      : { text: t.failed, kind: "no" };
  }
  if (!campaign.live) return { text: t.waiting, kind: "rule" };
  return { text: t.open, kind: "ok" };
}
