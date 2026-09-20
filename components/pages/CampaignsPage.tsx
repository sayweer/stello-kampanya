"use client";

// Campaigns — the first screen inside the app. Laid out like the reference's Overview: one
// loud verdict at the top, the full ledger under it, the rules in the side column.
import { config } from "@stello/core";
import { motion } from "framer-motion";

import { useCampaignList } from "@/lib/hooks.ts";
import { fmtUsdc, shortAddr, timeLeft, verdictOf } from "../shell/format";

const EASE = [0.2, 0.7, 0.3, 1] as const;
const EXPLORER = "https://stellar.expert/explorer/testnet";

const fadeUp = (delay: number) => ({
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.45, delay, ease: EASE },
});

export default function CampaignsPage({
  onOpen,
  onNew,
}: {
  onOpen: (id: bigint) => void;
  onNew: () => void;
}) {
  const campaigns = useCampaignList();

  // The one worth joining right now: open, live, and closest to its deadline.
  const featured =
    campaigns
      ?.filter((c) => c.live && c.secondsLeft > 0)
      .sort((a, b) => a.secondsLeft - b.secondsLeft)[0] ?? null;

  const open = campaigns?.filter((c) => c.secondsLeft > 0).length ?? 0;
  const closed = (campaigns?.length ?? 0) - open;

  if (campaigns !== null && campaigns.length === 0) {
    return (
      <div style={{ minHeight: "70vh", display: "grid", placeItems: "center" }}>
        <div
          style={{
            maxWidth: 440,
            textAlign: "center",
            padding: "24px 16px",
            display: "flex",
            flexDirection: "column",
            gap: 12,
            alignItems: "center",
          }}
        >
          <div style={{ fontSize: 40, color: "var(--ink)" }}>◭</div>
          <h1 className="panel__title" style={{ margin: 0, fontSize: 30, fontWeight: 500 }}>
            Yeterli kişi çıkarsa olacak işler için.
          </h1>
          <p className="panel__note" style={{ margin: 0, fontSize: 14.5 }}>
            Hedefi ve süreyi koy, bonusu kilitle. Katılanlar yalnızca havale gönderir; tutmazsa
            paraları ve bonus payları kendiliğinden döner.
          </p>
          <button className="btn btn--lg" onClick={onNew} type="button">
            İlk kampanyayı aç
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page__main">
        <motion.section className={`verdict${featured ? "" : " verdict--quiet"}`} {...fadeUp(0)}>
          {featured ? (
            <>
              <div>
                <div className="eyebrow">Şu an katılabileceğin · {timeLeft(featured.secondsLeft)} kaldı</div>
                <div className="verdict__line">
                  <span className="verdict__amount">
                    {fmtUsdc(featured.total)} / {fmtUsdc(featured.goal)} USDC
                  </span>
                </div>
                <div className="verdict__why">{featured.title}</div>
              </div>
              <div className="verdict__side">
                <span className="pill pill--lg pill--ok">{featured.pledgers} kişi katıldı</span>
                <button className="btn" onClick={() => onOpen(featured.id)} type="button">
                  Kampanyayı aç →
                </button>
              </div>
            </>
          ) : (
            <div>
              <div className="eyebrow">Şu an katılabileceğin</div>
              <div className="verdict__line">
                <span className="verdict__amount">
                  {campaigns === null ? "Okunuyor…" : "Şimdilik yok"}
                </span>
              </div>
              <div className="verdict__why">
                Açık bir kampanya olduğunda burada görünür — kalan süresi, toplanan tutarı ve
                katılan kişi sayısıyla.
              </div>
            </div>
          )}
        </motion.section>

        <motion.div {...fadeUp(0.08)}>
          <section className="panel ledger">
            <div className="ledger__head">
              <div className="eyebrow">Bütün kampanyalar</div>
              <div className="ledger__counts">
                <span className="count">
                  <i className="mark mark--ok" />
                  {open} açık
                </span>
                <span className="count">
                  <i className="mark mark--no" />
                  {closed} kapandı
                </span>
              </div>
            </div>

            <div className="ledger__row ledger__row--camp ledger__row--head">
              <span className="eyebrow">Kalan</span>
              <span className="eyebrow">Durum</span>
              <span className="eyebrow">Kampanya</span>
              <span className="eyebrow sm-hide" style={{ textAlign: "right" }}>
                Toplanan
              </span>
            </div>

            {!campaigns || campaigns.length === 0 ? (
              <div className="ledger__empty">
                {campaigns === null ? "Zincirden okunuyor…" : "Henüz kampanya yok."}
              </div>
            ) : (
              campaigns.map((c) => {
                const v = verdictOf(c);
                return (
                  <div
                    key={String(c.id)}
                    className={`ledger__row ledger__row--camp${c.secondsLeft > 0 ? "" : " ledger__row--quiet"}`}
                    onClick={() => onOpen(c.id)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === "Enter" && onOpen(c.id)}
                  >
                    <span className="ledger__when">{timeLeft(c.secondsLeft)}</span>
                    <span className={`ledger__kind${v.kind === "no" ? " is-no" : ""}`}>{v.text}</span>
                    <span className="ledger__what" title={c.title}>
                      {c.title}
                    </span>
                    <span className="ledger__amt sm-hide">
                      {fmtUsdc(c.total)} / {fmtUsdc(c.goal)}
                    </span>
                  </div>
                );
              })
            )}
          </section>
        </motion.div>
      </div>

      <div className="page__side">
        <motion.section className="panel panel--pad" {...fadeUp(0.06)}>
          <div className="eyebrow">Nasıl katılırım</div>
          <div className="steps" style={{ marginTop: 14 }}>
            <div className="step">
              <span className="step__n">1</span>
              <div style={{ fontSize: 13.5 }}>Bir kampanya seç, ne kadar TL göndereceğini yaz.</div>
            </div>
            <div className="step">
              <span className="step__n">2</span>
              <div style={{ fontSize: 13.5 }}>Verilen IBAN'a, sana özel açıklama koduyla havale yap.</div>
            </div>
            <div className="step">
              <span className="step__n">3</span>
              <div style={{ fontSize: 13.5 }}>Tutmazsa paran ve bonus payın kendiliğinden döner.</div>
            </div>
          </div>
        </motion.section>

        <motion.section className="panel panel--pad" {...fadeUp(0.1)}>
          <div className="panel__head">
            <div className="eyebrow">Kurallar</div>
            <a
              className="linkbtn"
              style={{ whiteSpace: "nowrap" }}
              href={`${EXPLORER}/contract/${config.campaignId}`}
              target="_blank"
              rel="noreferrer"
            >
              {shortAddr(config.campaignId)} ↗
            </a>
          </div>
          <div className="panel__kv">
            <span>Bonus</span>
            <span style={{ color: "var(--ink)" }}>baştan kilitli</span>
          </div>
          <div className="panel__kv">
            <span>İade</span>
            <span style={{ color: "var(--ink)" }}>imza istemez</span>
          </div>
          <div className="panel__kv">
            <span>Aynı havale</span>
            <span style={{ color: "var(--ink)" }}>bir kez sayılır</span>
          </div>
          <div style={{ marginTop: 16 }}>
            <button className="btn btn--ghost" onClick={onNew} type="button">
              Kampanya aç
            </button>
          </div>
        </motion.section>
      </div>
    </div>
  );
}
