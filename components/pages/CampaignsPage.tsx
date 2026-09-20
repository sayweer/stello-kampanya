"use client";

// Campaigns — the first screen inside the app. Laid out like the reference's Overview: one
// loud verdict at the top, the full ledger under it, the rules in the side column.
import { campaignConfig } from "@/lib/campaign";
import { motion } from "framer-motion";

import { useCampaignList } from "@/lib/hooks";
import { useCopy } from "@/lib/copy/context";
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
  const c = useCopy();
  const t = c.campaignsPage;

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
            {t.emptyTitle}
          </h1>
          <p className="panel__note" style={{ margin: 0, fontSize: 14.5 }}>
            {t.emptyNote}
          </p>
          <button className="btn btn--lg" onClick={onNew} type="button">
            {t.emptyCta}
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
                <div className="eyebrow">
                  {t.featuredEyebrow} · {t.featuredLeft.replace("%t", timeLeft(featured.secondsLeft, c.format))}
                </div>
                <div className="verdict__line">
                  <span className="verdict__amount">
                    {fmtUsdc(featured.total, c.format.locale)} / {fmtUsdc(featured.goal, c.format.locale)} USDC
                  </span>
                </div>
                <div className="verdict__why">{featured.title}</div>
              </div>
              <div className="verdict__side">
                <span className="pill pill--lg pill--ok">
                  {featured.pledgers} {t.peopleJoined}
                </span>
                <button className="btn" onClick={() => onOpen(featured.id)} type="button">
                  {t.openCampaign}
                </button>
              </div>
            </>
          ) : (
            <div>
              <div className="eyebrow">{t.featuredEyebrow}</div>
              <div className="verdict__line">
                <span className="verdict__amount">
                  {campaigns === null ? t.reading : t.noneYet}
                </span>
              </div>
              <div className="verdict__why">{t.noneNote}</div>
            </div>
          )}
        </motion.section>

        <motion.div {...fadeUp(0.08)}>
          <section className="panel ledger">
            <div className="ledger__head">
              <div className="eyebrow">{t.allCampaigns}</div>
              <div className="ledger__counts">
                <span className="count">
                  <i className="mark mark--ok" />
                  {open} {t.open}
                </span>
                <span className="count">
                  <i className="mark mark--no" />
                  {closed} {t.closed}
                </span>
              </div>
            </div>

            <div className="ledger__row ledger__row--camp ledger__row--head">
              <span className="eyebrow">{t.colLeft}</span>
              <span className="eyebrow">{t.colStatus}</span>
              <span className="eyebrow">{t.colCampaign}</span>
              <span className="eyebrow sm-hide" style={{ textAlign: "right" }}>
                {t.colRaised}
              </span>
            </div>

            {!campaigns || campaigns.length === 0 ? (
              <div className="ledger__empty">
                {campaigns === null ? t.readingChain : t.noCampaigns}
              </div>
            ) : (
              campaigns.map((camp) => {
                const v = verdictOf(camp, c.verdict);
                return (
                  <div
                    key={String(camp.id)}
                    className={`ledger__row ledger__row--camp${camp.secondsLeft > 0 ? "" : " ledger__row--quiet"}`}
                    onClick={() => onOpen(camp.id)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === "Enter" && onOpen(camp.id)}
                  >
                    <span className="ledger__when">{timeLeft(camp.secondsLeft, c.format)}</span>
                    <span className={`ledger__kind${v.kind === "no" ? " is-no" : ""}`}>{v.text}</span>
                    <span className="ledger__what" title={camp.title}>
                      {camp.title}
                    </span>
                    <span className="ledger__amt sm-hide">
                      {fmtUsdc(camp.total, c.format.locale)} / {fmtUsdc(camp.goal, c.format.locale)}
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
          <div className="eyebrow">{t.howToJoin}</div>
          <div className="steps" style={{ marginTop: 14 }}>
            {t.joinSteps.map((step, i) => (
              <div className="step" key={i}>
                <span className="step__n">{i + 1}</span>
                <div style={{ fontSize: 13.5 }}>{step}</div>
              </div>
            ))}
          </div>
        </motion.section>

        <motion.section className="panel panel--pad" {...fadeUp(0.1)}>
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
            <span>{t.ruleBonus}</span>
            <span style={{ color: "var(--ink)" }}>{t.ruleBonusValue}</span>
          </div>
          <div className="panel__kv">
            <span>{t.ruleRefund}</span>
            <span style={{ color: "var(--ink)" }}>{t.ruleRefundValue}</span>
          </div>
          <div className="panel__kv">
            <span>{t.ruleOnce}</span>
            <span style={{ color: "var(--ink)" }}>{t.ruleOnceValue}</span>
          </div>
          <div style={{ marginTop: 16 }}>
            <button className="btn btn--ghost" onClick={onNew} type="button">
              {t.create}
            </button>
          </div>
        </motion.section>
      </div>
    </div>
  );
}
