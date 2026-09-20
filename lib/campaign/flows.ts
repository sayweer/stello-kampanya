import type { Keypair } from "@stellar/stellar-sdk";
import { price, Stello, toStroops, type DepositHandle, type OnStep } from "stello-sdk";

import { encodeArg, KIND_BONUS, KIND_PLEDGE } from "./codec";
import { campaignConfig } from "./config";
import {
  campaignCount,
  claim,
  getCampaign,
  getPledge,
  pledgerAt,
  quoteClaim,
  withdrawProceeds,
  type Campaign,
  type Status,
} from "./contracts";

/**
 * "Ya olur ya kazanırsın", built on stello-sdk from npm like any other app.
 *
 * What lives here is only what is specific to the campaign: what the argument
 * bytes mean, when a pledge is claimable, how a bonus is funded. The
 * bank-transfer machinery is the SDK's, and it knows none of this.
 */
const stello = new Stello({ route: campaignConfig.routeId, relayUrl: campaignConfig.relayUrl });

export type { DepositHandle as JoinHandle, OnStep, StepName } from "stello-sdk";

export async function ensureReady(keypair: Keypair, onStep?: OnStep): Promise<string> {
  return stello.ensureReady(keypair, onStep);
}

/** A pledge or a bonus, depending on `kind` — both are just deposits. */
export async function startJoin({
  keypair,
  campaignId,
  amountTry,
  kind = KIND_PLEDGE,
  onStep,
}: {
  keypair: Keypair;
  campaignId: bigint;
  amountTry: string;
  kind?: typeof KIND_PLEDGE | typeof KIND_BONUS;
  onStep?: OnStep;
}): Promise<DepositHandle> {
  return stello.requestDeposit({
    keypair,
    arg: encodeArg(kind, campaignId),
    amountTry,
    onStep,
  });
}

/** Demo only: stands in for the participant's banking app. */
export async function confirmDemoTransfer(
  handle: DepositHandle,
  amountTry: string,
): Promise<void> {
  await stello.simulateBankTransfer(handle, amountTry);
}

/**
 * Waits for the transfer to become a pledge. The router's event says the money
 * reached the contract; the campaign's own state says what it made of it.
 */
export async function waitForDeposit({
  keypair,
  campaignId,
  handle,
  triggerRelay,
  onStep,
  timeoutMs = 120_000,
}: {
  keypair: Keypair;
  campaignId: bigint;
  handle: DepositHandle;
  triggerRelay?: () => Promise<unknown>;
  onStep?: OnStep;
  timeoutMs?: number;
}): Promise<{ pledged: bigint; delivered: bigint; accepted: boolean }> {
  const dispatched = await stello.waitForDeposit({ handle, triggerRelay, onStep, timeoutMs });
  const pledge = await getPledge(campaignId, keypair.publicKey());

  return {
    pledged: pledge?.amount ?? 0n,
    delivered: dispatched.amount,
    // False means the campaign refused it and refunded in the same transaction
    // — closed, not live yet, or a payload it could not read.
    accepted: dispatched.accepted,
  };
}

/** Organizer flow: lock the bonus that makes the promise credible. */
export async function fundBonus({
  keypair,
  campaignId,
  onStep,
  triggerRelay,
}: {
  keypair: Keypair;
  campaignId: bigint;
  onStep?: OnStep;
  triggerRelay?: () => Promise<unknown>;
}): Promise<Campaign> {
  const campaign = await getCampaign(campaignId);
  if (!campaign) throw new Error(`kampanya ${campaignId} yok`);

  const missing = campaign.bonus - campaign.bonus_funded;
  if (missing <= 0n) return campaign;

  // Ask for slightly more lira than the shortfall so the anchor's fee does not
  // leave the bonus a few stroops short; the contract refunds any excess.
  const quote = await price("100").catch(() => null);
  const perTry = quote ? Number(toStroops(quote.usdc)) / 100 : 0;
  const amountTry = perTry > 0 ? Math.ceil((Number(missing) / perTry) * 1.01).toString() : "100";

  const handle = await startJoin({ keypair, campaignId, amountTry, kind: KIND_BONUS, onStep });
  await confirmDemoTransfer(handle, amountTry);
  await waitForDeposit({ keypair, campaignId, handle, triggerRelay, onStep });

  return (await getCampaign(campaignId))!;
}

/**
 * The refund path end to end: claim if it has not been claimed yet, then cash
 * out. The claim is campaign business; the cash-out is the shared client.
 */
export async function claimAndWithdraw({
  keypair,
  campaignId,
  onStep,
}: {
  keypair: Keypair;
  campaignId: bigint;
  onStep?: OnStep;
}): Promise<{ usdc: bigint; tryAmount?: string }> {
  const account = keypair.publicKey();
  const pledge = await getPledge(campaignId, account);

  if (pledge && !pledge.claimed) {
    onStep?.("claimed");
    await claim(keypair, campaignId, account);
  }
  return stello.withdrawToIban({ keypair, onStep });
}

/** Organizer's success path: take the proceeds, then cash them out. */
export async function withdrawProceedsToIban({
  keypair,
  campaignId,
  onStep,
}: {
  keypair: Keypair;
  campaignId: bigint;
  onStep?: OnStep;
}): Promise<{ usdc: bigint; tryAmount?: string }> {
  const campaign = await getCampaign(campaignId);
  if (!campaign) throw new Error(`kampanya ${campaignId} yok`);

  if (!campaign.proceeds_taken) {
    onStep?.("settled");
    await withdrawProceeds(keypair, campaignId);
  }
  return stello.withdrawToIban({ keypair, onStep });
}

/**
 * Refunds everyone who pledged, in one go. This is what makes "if it does not
 * happen, your money comes back by itself" literally true: claim needs no
 * signature from the pledger, and always pays the pledger.
 */
export async function refundAll({
  payer,
  campaignId,
  onProgress,
}: {
  payer: Keypair;
  campaignId: bigint;
  onProgress?: (done: number, total: number, user: string) => void;
}): Promise<{ refunded: number; total: bigint }> {
  const campaign = await getCampaign(campaignId);
  if (!campaign) throw new Error(`kampanya ${campaignId} yok`);

  let refunded = 0;
  let total = 0n;
  for (let index = 0; index < campaign.pledgers; index++) {
    const user = await pledgerAt(campaignId, index);
    if (!user) continue;

    const pledge = await getPledge(campaignId, user);
    if (!pledge || pledge.claimed) continue;

    total += await claim(payer, campaignId, user);
    refunded++;
    onProgress?.(refunded, campaign.pledgers, user);
  }
  return { refunded, total };
}

// --- views ---

export interface CampaignView {
  id: bigint;
  title: string;
  organizer: string;
  goal: bigint;
  total: bigint;
  percent: number;
  pledgers: number;
  bonus: bigint;
  bonusFunded: bigint;
  cap: bigint;
  live: boolean;
  status: Status;
  deadline: number;
  secondsLeft: number;
  mine?: { pledged: bigint; claimed: boolean; claimable: bigint };
}

export async function campaignView(id: bigint, user?: string): Promise<CampaignView | null> {
  const campaign = await getCampaign(id);
  if (!campaign) return null;

  const deadline = Number(campaign.deadline);
  const view: CampaignView = {
    id,
    title: campaign.title,
    organizer: campaign.organizer,
    goal: campaign.goal,
    total: campaign.total,
    percent: campaign.goal > 0n ? Number((campaign.total * 100n) / campaign.goal) : 0,
    pledgers: campaign.pledgers,
    bonus: campaign.bonus,
    bonusFunded: campaign.bonus_funded,
    cap: campaign.cap,
    live: campaign.bonus_funded >= campaign.bonus,
    status: campaign.status,
    deadline,
    secondsLeft: Math.max(0, deadline - Math.floor(Date.now() / 1000)),
  };

  if (user) {
    const pledge = await getPledge(id, user);
    if (pledge) {
      view.mine = {
        pledged: pledge.amount,
        claimed: pledge.claimed,
        claimable: pledge.claimed ? 0n : await quoteClaim(id, user),
      };
    }
  }
  return view;
}

export async function listCampaigns(): Promise<CampaignView[]> {
  const count = await campaignCount();
  const views = await Promise.all(
    Array.from({ length: Number(count) }, (_, index) => campaignView(BigInt(index + 1))),
  );
  return views.filter((view): view is CampaignView => view !== null).reverse();
}
