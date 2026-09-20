"use client";

// The organizer's side: name the thing, set the goal and the deadline, and lock the bonus that
// makes the promise worth believing.
import { toStroops } from "stello-sdk";
import { createCampaign, ensureReady, fundBonus } from "@/lib/campaign";
import { motion } from "framer-motion";
import { useState } from "react";

import { useFlow, useWallet } from "@/lib/hooks";
import { useCopy } from "@/lib/copy/context";
import { triggerRelay } from "@/lib/wallet";

const EASE = [0.2, 0.7, 0.3, 1] as const;

const fadeUp = (delay: number) => ({
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.45, delay, ease: EASE },
});


export default function NewCampaignPage({ onCreated }: { onCreated: (id: bigint) => void }) {
  const c = useCopy();
  const t = c.newPage;
  const DURATIONS = t.durations;
  const { ensureKeypair } = useWallet();
  const flow = useFlow<bigint>();

  const [title, setTitle] = useState("");
  const [goal, setGoal] = useState("100");
  const [bonus, setBonus] = useState("10");
  const [cap, setCap] = useState("4");
  const [duration, setDuration] = useState(t.durations[0]!.seconds);

  const valid = title.trim().length > 0 && Number(goal) > 0 && Number(cap) > 0 && Number(bonus) >= 0;

  const submit = () =>
    flow
      .run(async (onStep) => {
        const keypair = ensureKeypair();
        await ensureReady(keypair, onStep);

        const id = await createCampaign(keypair, {
          title: title.trim().slice(0, 64),
          goal: toStroops(goal),
          deadline: BigInt(Math.floor(Date.now() / 1000) + duration),
          bonus: toStroops(bonus),
          cap: toStroops(cap),
        });

        // The campaign only opens once the bonus is actually in the contract.
        if (Number(bonus) > 0) {
          await fundBonus({ keypair, campaignId: id, onStep, triggerRelay });
        }
        return id;
      })
      .then((id) => id !== null && onCreated(id));

  return (
    <div className="page">
      <div className="page__main">
        <motion.section className="panel panel--pad" {...fadeUp(0)}>
          <div className="eyebrow">{t.eyebrow}</div>
          <div className="panel__title">{t.title}</div>
          <div className="panel__note">{t.note}</div>

          <div style={{ display: "grid", gap: 16, marginTop: 6 }}>
            <label className="lab">
              <span className="eyebrow">{t.whatFor}</span>
              <input
                className="field"
                value={title}
                maxLength={64}
                placeholder={t.titlePlaceholder}
                aria-label={t.titleAria}
                onChange={(e) => setTitle(e.target.value)}
              />
            </label>

            <div className="two">
              <label className="lab">
                <span className="eyebrow">{t.goal}</span>
                <input
                  className="field field--mono"
                  inputMode="decimal"
                  aria-label={t.goalAria}
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                />
              </label>
              <label className="lab">
                <span className="eyebrow">{t.bonus}</span>
                <input
                  className="field field--mono"
                  inputMode="decimal"
                  aria-label={t.bonusAria}
                  value={bonus}
                  onChange={(e) => setBonus(e.target.value)}
                />
              </label>
            </div>

            <div className="two">
              <label className="lab">
                <span className="eyebrow">{t.cap}</span>
                <input
                  className="field field--mono"
                  inputMode="decimal"
                  aria-label={t.capAria}
                  value={cap}
                  onChange={(e) => setCap(e.target.value)}
                />
                <span className="panel__note">{t.capNote}</span>
              </label>
              <div className="lab">
                <span className="eyebrow">{t.duration}</span>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }} role="group" aria-label={t.duration}>
                  {DURATIONS.map((d) => (
                    <button
                      key={d.seconds}
                      className={`chip${duration === d.seconds ? " is-on" : ""}`}
                      onClick={() => setDuration(d.seconds)}
                      aria-pressed={duration === d.seconds}
                      type="button"
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <button
                className="btn btn--lg"
                onClick={() => void submit()}
                disabled={!valid || flow.busy}
                type="button"
              >
                {flow.busy ? t.opening : t.submit}
              </button>
            </div>

            {flow.step && (
              <div className="steps">
                <div className="step">
                  <span className="step__n">…</span>
                  <div style={{ fontSize: 13.5 }}>
                    {c.steps[flow.step.name] ?? flow.step.name}
                    {flow.step.detail ? ` (${flow.step.detail})` : ""}
                  </div>
                </div>
              </div>
            )}
            {flow.error && <div className="err">{flow.error}</div>}
          </div>
        </motion.section>
      </div>

      <div className="page__side">
        <motion.section className="panel panel--pad" {...fadeUp(0.06)}>
          <div className="eyebrow">{t.whyBonus}</div>
          <div className="panel__note">{t.whyBonusText}</div>
        </motion.section>

        <motion.section className="panel panel--pad" {...fadeUp(0.1)}>
          <div className="eyebrow">{t.whyCap}</div>
          <div className="panel__note">{t.whyCapText}</div>
        </motion.section>
      </div>
    </div>
  );
}
