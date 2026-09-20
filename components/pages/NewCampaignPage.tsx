"use client";

// The organizer's side: name the thing, set the goal and the deadline, and lock the bonus that
// makes the promise worth believing.
import { createCampaign, ensureReady, fundBonus, toStroops, type StepName } from "@stello/core";
import { motion } from "framer-motion";
import { useState } from "react";

import { useFlow, useWallet } from "@/lib/hooks.ts";
import { triggerRelay } from "@/lib/wallet.ts";

const EASE = [0.2, 0.7, 0.3, 1] as const;

const fadeUp = (delay: number) => ({
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.45, delay, ease: EASE },
});

const STEP_LABEL: Partial<Record<StepName, string>> = {
  account: "Hesabın açılıyor",
  trustline: "Para alabilmen için izin veriliyor",
  signin: "Ödeme kuruluşuna giriş yapılıyor",
  customer: "Kimliğin kaydediliyor",
  ticket: "Bonus için açıklama kodu alınıyor",
  deposit: "IBAN hazırlanıyor",
  "waiting-transfer": "Bonus havalesi bekleniyor",
  "waiting-chain": "Bonus kontrata kilitleniyor",
};

const DURATIONS = [
  { label: "5 dk", seconds: 300 },
  { label: "1 saat", seconds: 3600 },
  { label: "1 gün", seconds: 86_400 },
  { label: "1 hafta", seconds: 604_800 },
];

export default function NewCampaignPage({ onCreated }: { onCreated: (id: bigint) => void }) {
  const { ensureKeypair } = useWallet();
  const flow = useFlow<bigint>();

  const [title, setTitle] = useState("");
  const [goal, setGoal] = useState("100");
  const [bonus, setBonus] = useState("10");
  const [cap, setCap] = useState("4");
  const [duration, setDuration] = useState(DURATIONS[0]!.seconds);

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
          <div className="eyebrow">Yeni kampanya</div>
          <div className="panel__title">Hedefi koy, bonusu kilitle.</div>
          <div className="panel__note">
            Bonus kontrata yatmadan kampanya katılıma açılmaz. Hedef tutmazsa katılanlara dağılır,
            tutarsa sana geri döner. Bir söz değil — Stellar'da zorlanan bir kural.
          </div>

          <div style={{ display: "grid", gap: 16, marginTop: 6 }}>
            <label className="lab">
              <span className="eyebrow">Ne için toplanıyor</span>
              <input
                className="field"
                value={title}
                maxLength={64}
                placeholder="Gece pizzası"
                aria-label="Kampanyanın adı"
                onChange={(e) => setTitle(e.target.value)}
              />
            </label>

            <div className="two">
              <label className="lab">
                <span className="eyebrow">Hedef (USDC)</span>
                <input
                  className="field field--mono"
                  inputMode="decimal"
                  aria-label="Hedef, USDC"
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                />
              </label>
              <label className="lab">
                <span className="eyebrow">Kilitlenecek bonus (USDC)</span>
                <input
                  className="field field--mono"
                  inputMode="decimal"
                  aria-label="Bonus, USDC"
                  value={bonus}
                  onChange={(e) => setBonus(e.target.value)}
                />
              </label>
            </div>

            <div className="two">
              <label className="lab">
                <span className="eyebrow">Kişi başı tavan (USDC)</span>
                <input
                  className="field field--mono"
                  inputMode="decimal"
                  aria-label="Kişi başı bonus tavanı, USDC"
                  value={cap}
                  onChange={(e) => setCap(e.target.value)}
                />
                <span className="panel__note">Bonus payı kişi başı bu tutara kadar sayılır.</span>
              </label>
              <div className="lab">
                <span className="eyebrow">Süre</span>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }} role="group" aria-label="Süre">
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
                {flow.busy ? "Açılıyor…" : "Kampanyayı aç ve bonusu kilitle"}
              </button>
            </div>

            {flow.step && (
              <div className="steps">
                <div className="step">
                  <span className="step__n">…</span>
                  <div style={{ fontSize: 13.5 }}>
                    {STEP_LABEL[flow.step.name] ?? flow.step.name}
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
          <div className="eyebrow">Bonus neden var</div>
          <div className="panel__note">
            "Yeterli kişi olursa" işlerinde herkes başkasının önce davranmasını bekler. Bonus,
            erken katılana "tutmazsa kazanırsın" der — beklemeyi anlamsız kılar.
          </div>
        </motion.section>

        <motion.section className="panel panel--pad" {...fadeUp(0.1)}>
          <div className="eyebrow">Tavan neden var</div>
          <div className="panel__note">
            Bonus payı kişi başı bu tutara kadar sayılır. Son dakikada büyük para koyup bonusu
            toplamak işe yaramaz.
          </div>
        </motion.section>
      </div>
    </div>
  );
}
