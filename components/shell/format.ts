import { fromStroops, Status, type CampaignView } from "@stello/core";

/** "12.5" rather than "12.5000000"; two decimals is what a person reads as money. */
export function fmtUsdc(stroops: bigint): string {
  const value = Number(fromStroops(stroops));
  return value.toLocaleString("tr-TR", { maximumFractionDigits: 2 });
}

export function shortAddr(address: string): string {
  return `${address.slice(0, 4)}…${address.slice(-4)}`;
}

/** "3 gün 4 sa", "18 dk", "42 sn" — never a raw timestamp. */
export function timeLeft(seconds: number): string {
  if (seconds <= 0) return "süre doldu";
  const days = Math.floor(seconds / 86_400);
  const hours = Math.floor((seconds % 86_400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (days) return `${days} gün ${hours} sa`;
  if (hours) return `${hours} sa ${minutes} dk`;
  if (minutes) return `${minutes} dk`;
  return `${seconds} sn`;
}

export type Verdict = { text: string; kind: "ok" | "no" | "rule" };

/** One word for where a campaign stands, and whether it is good news. */
export function verdictOf(campaign: CampaignView): Verdict {
  if (campaign.status === Status.Succeeded) return { text: "Tuttu", kind: "ok" };
  if (campaign.status === Status.Failed) return { text: "Tutmadı", kind: "no" };
  // Still open on-chain but past its deadline: the first claim or settle closes it.
  if (campaign.secondsLeft === 0) {
    return campaign.total >= campaign.goal
      ? { text: "Tuttu", kind: "ok" }
      : { text: "Tutmadı", kind: "no" };
  }
  if (!campaign.live) return { text: "Bekliyor", kind: "rule" };
  return { text: "Açık", kind: "ok" };
}
