"use client";

// One campaign: where it stands, what you would get, and the door in. The join flow never
// leaves this page — the participant sees an IBAN and a reference code, nothing about chains.
import {
  campaignConfig,
  claimAndWithdraw,
  confirmDemoTransfer,
  startJoin,
  Status,
  waitForDeposit,
  type JoinHandle,
} from "@/lib/campaign";
import { motion } from "framer-motion";
import { useState } from "react";

import { useCampaign, useFlow, useWallet } from "@/lib/hooks";
import { useCopy } from "@/lib/copy/context";
import { triggerRelay } from "@/lib/wallet";
import { fmtUsdc, shortAddr, timeLeft, verdictOf } from "../shell/format";

const EASE = [0.2, 0.7, 0.3, 1] as const;
const EXPLORER = "https://stellar.expert/explorer/testnet";

const fadeUp = (delay: number) => ({
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.45, delay, ease: EASE },
});


export default function CampaignPage({ id, onBack }: { id: bigint; onBack: () => void }) {
  const c = useCopy();
  const t = c.campaignPage;
  const money = (v: bigint) => fmtUsdc(v, c.format.locale);
  const { view, error: loadError } = useCampaign(id, 2500);
  const { ensureKeypair } = useWallet();
  const join = useFlow<JoinHandle>();
  const settle = useFlow<unknown>();

  const [amountTry, setAmountTry] = useState("100");
  const [handle, setHandle] = useState<JoinHandle | null>(null);
  const [joined, setJoined] = useState(false);
  const [paidOut, setPaidOut] = useState<string | null>(null);

  if (!view) {
    return (
      <div className="page">
        <div className="page__main">
          <section className="verdict verdict--quiet">
            <div>
              <div className="eyebrow">{t.eyebrow.replace("%n", String(id))}</div>
              <div className="verdict__line">
                <span className="verdict__amount">
                  {loadError ? t.unreadable : t.readingChain}
                </span>
              </div>
              {loadError && <div className="verdict__why">{loadError}</div>}
            </div>
          </section>
        </div>
      </div>
    );
  }

  const verdict = verdictOf(view, c.verdict);
  const isOpen = view.status === Status.Open && view.secondsLeft > 0;
  const failed = verdict.kind === "no";
  const percent = Math.min(100, view.percent);

  const startJoining = () =>
    join
      .run((onStep) =>
        startJoin({ keypair: ensureKeypair(), campaignId: id, amountTry, onStep }),
      )
      .then((result) => result && setHandle(result));

  const confirmTransfer = () =>
    handle &&
    join
      .run(async (onStep) => {
        await confirmDemoTransfer(handle, amountTry);
        await waitForDeposit({
          keypair: ensureKeypair(),
          campaignId: id,
          handle,
          triggerRelay,
          onStep,
        });
        return handle;
      })
      .then((result) => {
        if (result) {
          setJoined(true);
          setHandle(null);
        }
      });

  const cashOut = () =>
    settle
      .run((onStep) => claimAndWithdraw({ keypair: ensureKeypair(), campaignId: id, onStep }))
      .then((result) => {
        const paid = result as { tryAmount?: string } | null;
        if (paid) setPaidOut(paid.tryAmount ?? "");
      });

  const busyStep = join.step ?? settle.step;

  return (
    <div className="page">
      <div className="page__main">
        <motion.section className="verdict" {...fadeUp(0)}>
          <div>
            <div className="eyebrow">
              {t.eyebrow.replace("%n", String(id))} · {timeLeft(view.secondsLeft, c.format)}
              {isOpen ? ` ${t.left}` : ""}
            </div>
            <div className="verdict__line">
              <span className="verdict__amount">
                {money(view.total)} / {money(view.goal)} USDC
              </span>
            </div>
            <div className="verdict__why">{view.title}</div>
          </div>
          <div className="verdict__side">
            <span className={`pill pill--lg ${failed ? "pill--no" : "pill--ok"}`}>{verdict.text}</span>
            <button className="linkbtn" onClick={onBack} type="button">
              {t.back}
            </button>
          </div>
        </motion.section>

        <motion.section className="panel panel--pad" {...fadeUp(0.08)}>
          {/* ---- the door in ---- */}
          {isOpen && view.live && !handle && !joined && (
            <>
              <div className="eyebrow">{t.joinEyebrow}</div>
              <div className="panel__title">{t.joinTitle}</div>
              <div className="two" style={{ marginTop: 6, alignItems: "end" }}>
                <label className="lab">
                  <span className="eyebrow">{t.amountLabel}</span>
                  <input
                    className="field field--mono"
                    inputMode="numeric"
                    aria-label={t.amountAria}
                    value={amountTry}
                    onChange={(e) => setAmountTry(e.target.value.replace(/[^\d]/g, ""))}
                  />
                </label>
                <button
                  className="btn btn--lg"
                  onClick={() => void startJoining()}
                  disabled={join.busy || !amountTry}
                  type="button"
                >
                  {join.busy ? t.preparing : t.showIban}
                </button>
              </div>
              <div className="panel__note">{t.joinNote}</div>
            </>
          )}

          {isOpen && !view.live && (
            <div className="notice">
              <span>
                {t.notLiveYet
                  .replace("%f", money(view.bonusFunded))
                  .replace("%b", money(view.bonus))}
              </span>
            </div>
          )}

          {/* ---- the bank transfer ---- */}
          {handle && (
            <>
              <div className="eyebrow">{t.transferEyebrow}</div>
              <div className="panel__title">{t.transferTitle}</div>
              <div style={{ marginTop: 6, display: "grid", gap: 10 }}>
                <div className="panel__kv">
                  <span>{t.recipient}</span>
                  <span style={{ color: "var(--ink)", textAlign: "right" }}>{handle.iban ?? "—"}</span>
                </div>
                <div className="panel__kv">
                  <span>{t.amount}</span>
                  <span className="num">{amountTry} TL</span>
                </div>
                {handle.estimatedUsdc && (
                  <div className="panel__kv">
                    <span>{t.willCredit}</span>
                    <span className="num">≈ {Number(handle.estimatedUsdc).toFixed(2)} USDC</span>
                  </div>
                )}
              </div>
              <div style={{ marginTop: 16 }}>
                <button
                  className="btn btn--lg"
                  onClick={() => void confirmTransfer()}
                  disabled={join.busy}
                  type="button"
                >
                  {join.busy ? t.waiting : t.confirmTransfer}
                </button>
              </div>
              <div className="panel__note">{t.transferNote}</div>
            </>
          )}

          {joined && (
            <div className="notice">
              <span>{t.joined}</span>
            </div>
          )}

          {/* ---- the way out ---- */}
          {!isOpen && failed && view.mine && !view.mine.claimed && paidOut === null && (
            <>
              <div className="eyebrow">{t.failedEyebrow}</div>
              <div className="panel__title">{t.failedTitle}</div>
              <div className="meter__big">
                <span className="num">{money(view.mine.claimable)}</span>
                <span> {t.yourReturn}</span>
              </div>
              <div style={{ marginTop: 16 }}>
                <button
                  className="btn btn--lg"
                  onClick={() => void cashOut()}
                  disabled={settle.busy}
                  type="button"
                >
                  {settle.busy ? t.sending : t.cashOut}
                </button>
              </div>
            </>
          )}

          {paidOut !== null && (
            <div className="notice">
              <span>{paidOut ? t.paidOut.replace("%a", paidOut) : t.paidOutPlain}</span>
            </div>
          )}

          {!isOpen && !failed && (
            <div className="notice">
              <span>{t.succeeded}</span>
            </div>
          )}

          {/* ---- progress, named ---- */}
          {busyStep && (
            <div className="steps" style={{ marginTop: 18 }}>
              <div className="step">
                <span className="step__n">…</span>
                <div style={{ fontSize: 13.5 }}>
                  {c.steps[busyStep.name]}
                  {busyStep.detail ? ` (${busyStep.detail})` : ""}
                </div>
              </div>
            </div>
          )}
          {(join.error || settle.error) && (
            <div className="err" style={{ marginTop: 14 }}>
              {join.error ?? settle.error}
            </div>
          )}
        </motion.section>
      </div>

      <div className="page__side">
        <motion.section className="panel panel--pad" {...fadeUp(0.06)}>
          <div className="eyebrow">{t.toGoal}</div>
          <div className="meter__big">
            <span className="num">%{percent}</span>
          </div>
          <div className="bar">
            <div className="bar__fill" style={{ width: `${percent}%` }} />
          </div>
          <div className="meter__line">
            <span>{view.pledgers} {t.peopleShort}</span>
            <span className="num">{money(view.goal - view.total > 0n ? view.goal - view.total : 0n)} {t.remaining}</span>
          </div>
        </motion.section>

        {view.mine && (
          <motion.section className="panel panel--pad" {...fadeUp(0.1)}>
            <div className="eyebrow">{t.yourShare}</div>
            <div className="panel__kv" style={{ marginTop: 12 }}>
              <span>{t.pledged}</span>
              <span className="num">{money(view.mine.pledged)} USDC</span>
            </div>
            <div className="panel__kv">
              <span>{t.ifItFails}</span>
              <span className="num">{money(view.mine.claimable)} USDC</span>
            </div>
          </motion.section>
        )}

        <motion.section className="panel panel--pad" {...fadeUp(0.14)}>
          <div className="panel__head">
            <div className="eyebrow">{t.rules}</div>
            <a
              className="linkbtn"
              style={{ whiteSpace: "nowrap" }}
              href={`${EXPLORER}/contract/${campaignConfig.campaignId}`}
              target="_blank"
              rel="noreferrer"
            >
              {shortAddr(campaignConfig.campaignId)} ↗
            </a>
          </div>
          <div className="panel__kv">
            <span>{t.lockedBonus}</span>
            <span className="num">{money(view.bonusFunded)} USDC</span>
          </div>
          <div className="panel__kv">
            <span>{t.perPersonCap}</span>
            <span className="num">{money(view.cap)} USDC</span>
          </div>
          <div className="panel__kv">
            <span>{t.organizer}</span>
            <span className="num">{shortAddr(view.organizer)}</span>
          </div>
        </motion.section>
      </div>
    </div>
  );
}
