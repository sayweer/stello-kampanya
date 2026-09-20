import type { Keypair } from "@stellar/stellar-sdk";
import { invokeContract, readContract } from "stello-sdk";

import { campaignConfig } from "./config";

/** The campaign contract, called through the SDK's generic helpers. */

/** A unit enum crosses the boundary as its u32 discriminant. */
export const Status = { Open: 0, Succeeded: 1, Failed: 2 } as const;
export type Status = (typeof Status)[keyof typeof Status];

export interface Campaign {
  organizer: string;
  title: string;
  goal: bigint;
  deadline: bigint;
  bonus: bigint;
  bonus_funded: bigint;
  cap: bigint;
  total: bigint;
  weight_sum: bigint;
  pledgers: number;
  status: Status;
  proceeds_taken: boolean;
  bonus_reclaimed: boolean;
}

export interface Pledge {
  amount: bigint;
  claimed: boolean;
}

const id = campaignConfig.campaignId;

export const createCampaign = (
  organizer: Keypair,
  params: { title: string; goal: bigint; deadline: bigint; bonus: bigint; cap: bigint },
) => invokeContract<bigint>(id, organizer, "create", { organizer: organizer.publicKey(), ...params });

export const getCampaign = (campaign: bigint) =>
  readContract<Campaign | undefined>(id, "get_campaign", { campaign });

export const getPledge = (campaign: bigint, user: string) =>
  readContract<Pledge | undefined>(id, "get_pledge", { campaign, user });

export const quoteClaim = (campaign: bigint, user: string) =>
  readContract<bigint>(id, "quote_claim", { campaign, user });

export const campaignCount = () => readContract<bigint>(id, "count");

export const pledgerAt = (campaign: bigint, index: number) =>
  readContract<string | undefined>(id, "pledger_at", { campaign, index });

/** Permissionless: `payer` covers the fee, `user` receives the money. */
export const claim = (payer: Keypair, campaign: bigint, user: string) =>
  invokeContract<bigint>(id, payer, "claim", { campaign, user });

export const withdrawProceeds = (organizer: Keypair, campaign: bigint) =>
  invokeContract<bigint>(id, organizer, "withdraw_proceeds", { campaign });
