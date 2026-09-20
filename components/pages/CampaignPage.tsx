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
  type StepName,
} from "@/lib/campaign";
import { motion } from "framer-motion";
import { useState } from "react";

import { useCampaign, useFlow, useWallet } from "@/lib/hooks";
import { triggerRelay } from "@/lib/wallet";
import { fmtUsdc, shortAddr, timeLeft, verdictOf } from "../shell/format";

const EASE = [0.2, 0.7, 0.3, 1] as const;
const EXPLORER = "https://stellar.expert/explorer/testnet";

const fadeUp = (delay: number) => ({
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.45, delay, ease: EASE },
});

/** What each technical step means to someone who only knows their banking app. */
const STEP_LABEL: Record<StepName, string> = {
  account: "Hesabın açılıyor",
  trustline: "Para alabilmen için izin veriliyor",
  signin: "Ödeme kuruluşuna giriş yapılıyor",
  customer: "Kimliğin kaydediliyor",
  ticket: "Sana özel açıklama kodu alınıyor",
  deposit: "IBAN hazırlanıyor",
  "waiting-transfer": "Havalen bekleniyor",
  "waiting-chain": "Katılımın zincire yazılıyor",
  settled: "Kampanya sonuçlandırılıyor",
  claimed: "Paran hesabına aktarılıyor",
  withdrawing: "TL olarak IBAN'ına gönderiliyor",
  "paid-out": "Tamamlandı",
};

export default function CampaignPage({ id, onBack }: { id: bigint; onBack: () => void }) {
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
              <div className="eyebrow">Kampanya #{String(id)}</div>
              <div className="verdict__line">
                <span className="verdict__amount">
                  {loadError ? "Okunamadı" : "Zincirden okunuyor…"}
                </span>
              </div>
              {loadError && <div className="verdict__why">{loadError}</div>}
            </div>
          </section>
        </div>
      </div>
    );
  }

  const verdict = verdictOf(view);
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
              Kampanya #{String(id)} · {timeLeft(view.secondsLeft)}
              {isOpen ? " kaldı" : ""}
            </div>
            <div className="verdict__line">
              <span className="verdict__amount">
                {fmtUsdc(view.total)} / {fmtUsdc(view.goal)} USDC
              </span>
            </div>
            <div className="verdict__why">{view.title}</div>
          </div>
          <div className="verdict__side">
            <span className={`pill pill--lg ${failed ? "pill--no" : "pill--ok"}`}>{verdict.text}</span>
            <button className="linkbtn" onClick={onBack} type="button">
              ← tüm kampanyalar
            </button>
          </div>
        </motion.section>

        <motion.section className="panel panel--pad" {...fadeUp(0.08)}>
          {/* ---- the door in ---- */}
          {isOpen && view.live && !handle && !joined && (
            <>
              <div className="eyebrow">Katıl</div>
              <div className="panel__title">Bir havale yeter.</div>
              <div className="two" style={{ marginTop: 6, alignItems: "end" }}>
                <label className="lab">
                  <span className="eyebrow">Göndereceğin tutar (TL)</span>
                  <input
                    className="field field--mono"
                    inputMode="numeric"
                    aria-label="Göndereceğin tutar, TL"
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
                  {join.busy ? "Hazırlanıyor…" : "IBAN'ı göster"}
                </button>
              </div>
              <div className="panel__note">
                Hedef tutmazsa bu tutarın tamamı, bonustan payınla birlikte geri döner.
              </div>
            </>
          )}

          {isOpen && !view.live && (
            <div className="notice">
              <span>
                Organizatör bonusu henüz kilitlemedi ({fmtUsdc(view.bonusFunded)} /{" "}
                {fmtUsdc(view.bonus)} USDC). Kampanya o zaman katılıma açılır.
              </span>
            </div>
          )}

          {/* ---- the bank transfer ---- */}
          {handle && (
            <>
              <div className="eyebrow">Havaleni gönder</div>
              <div className="panel__title">Bu bilgilerle gönder.</div>
              <div style={{ marginTop: 6, display: "grid", gap: 10 }}>
                <div className="panel__kv">
                  <span>Alıcı</span>
                  <span style={{ color: "var(--ink)", textAlign: "right" }}>{handle.iban ?? "—"}</span>
                </div>
                <div className="panel__kv">
                  <span>Tutar</span>
                  <span className="num">{amountTry} TL</span>
                </div>
                {handle.estimatedUsdc && (
                  <div className="panel__kv">
                    <span>Kampanyaya yazılacak</span>
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
                  {join.busy ? "Bekleniyor…" : "Havaleyi yaptım (demo)"}
                </button>
              </div>
              <div className="panel__note">
                Test ağında gerçek banka yok; bu düğme havalenin ulaştığını bildirir. Gerçek ağda
                bu adımı bankan yapar.
              </div>
            </>
          )}

          {joined && (
            <div className="notice">
              <span>Katılımın zincire yazıldı. Sayaçta kendini görebilirsin.</span>
            </div>
          )}

          {/* ---- the way out ---- */}
          {!isOpen && failed && view.mine && !view.mine.claimed && paidOut === null && (
            <>
              <div className="eyebrow">Hedef tutmadı</div>
              <div className="panel__title">Paran geri dönüyor.</div>
              <div className="meter__big">
                <span className="num">{fmtUsdc(view.mine.claimable)}</span>
                <span> USDC — taahhüdün + bonus payın</span>
              </div>
              <div style={{ marginTop: 16 }}>
                <button
                  className="btn btn--lg"
                  onClick={() => void cashOut()}
                  disabled={settle.busy}
                  type="button"
                >
                  {settle.busy ? "Gönderiliyor…" : "IBAN'ıma çek"}
                </button>
              </div>
            </>
          )}

          {paidOut !== null && (
            <div className="notice">
              <span>{paidOut ? `${paidOut} TL IBAN'ına gönderildi.` : "Paran IBAN'ına gönderildi."}</span>
            </div>
          )}

          {!isOpen && !failed && (
            <div className="notice">
              <span>Hedef tuttu — iş oluyor. Toplanan tutar organizatöre geçti.</span>
            </div>
          )}

          {/* ---- progress, named ---- */}
          {busyStep && (
            <div className="steps" style={{ marginTop: 18 }}>
              <div className="step">
                <span className="step__n">…</span>
                <div style={{ fontSize: 13.5 }}>
                  {STEP_LABEL[busyStep.name]}
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
          <div className="eyebrow">Hedefe kalan</div>
          <div className="meter__big">
            <span className="num">%{percent}</span>
          </div>
          <div className="bar">
            <div className="bar__fill" style={{ width: `${percent}%` }} />
          </div>
          <div className="meter__line">
            <span>{view.pledgers} kişi</span>
            <span className="num">{fmtUsdc(view.goal - view.total > 0n ? view.goal - view.total : 0n)} kaldı</span>
          </div>
        </motion.section>

        {view.mine && (
          <motion.section className="panel panel--pad" {...fadeUp(0.1)}>
            <div className="eyebrow">Senin payın</div>
            <div className="panel__kv" style={{ marginTop: 12 }}>
              <span>Taahhüdün</span>
              <span className="num">{fmtUsdc(view.mine.pledged)} USDC</span>
            </div>
            <div className="panel__kv">
              <span>Tutmazsa alacağın</span>
              <span className="num">{fmtUsdc(view.mine.claimable)} USDC</span>
            </div>
          </motion.section>
        )}

        <motion.section className="panel panel--pad" {...fadeUp(0.14)}>
          <div className="panel__head">
            <div className="eyebrow">Kurallar</div>
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
            <span>Kilitli bonus</span>
            <span className="num">{fmtUsdc(view.bonusFunded)} USDC</span>
          </div>
          <div className="panel__kv">
            <span>Kişi başı tavan</span>
            <span className="num">{fmtUsdc(view.cap)} USDC</span>
          </div>
          <div className="panel__kv">
            <span>Organizatör</span>
            <span className="num">{shortAddr(view.organizer)}</span>
          </div>
        </motion.section>
      </div>
    </div>
  );
}
