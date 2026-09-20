"use client";

import { config, fromStroops } from "stello-sdk";
import { campaignConfig, type CampaignView } from "@/lib/campaign";

import StelloMark from "../StelloMark";
import { useCopy } from "@/lib/copy/context";

const EXPLORER = "https://stellar.expert/explorer/testnet";
const REPO = "https://github.com/sayweer/stello";

/** The footer carries the trust apparatus: a product that says "don't trust us, check the
 *  chain" has to say where to check. */

export default function Footer({ campaigns }: { campaigns: CampaignView[] | null }) {
  const { footer: f } = useCopy();
  const onChain = [
    { label: f.router, id: config.routerId },
    { label: f.campaignContract, id: campaignConfig.campaignId },
    { label: f.landing, id: config.landing, kind: "account" },
  ];
  const raised = (campaigns ?? []).reduce((sum, c) => sum + c.total, 0n);

  return (
    <footer className="lp__footer">
      <div className="lp__in">
        <div className="lp__footer-top">
          <div>
            <strong className="lp__footer-brand">
              <StelloMark size={18} />
              Stello
            </strong>
            <p className="lp__footer-line">{f.line}</p>
          </div>

          <div className="lp__footer-cols">
            <div>
              <div className="lp__footer-h">{f.product}</div>
              <a className="lp__link" href="#campaigns">
                {f.campaigns}
              </a>
              <a className="lp__link" href="#new">
                {f.create}
              </a>
            </div>

            <div>
              <div className="lp__footer-h">{f.resources}</div>
              <a className="lp__link" href={REPO} target="_blank" rel="noreferrer">
                GitHub ↗
              </a>
              <a className="lp__link" href={`${REPO}#readme`} target="_blank" rel="noreferrer">
                {f.architecture}
              </a>
            </div>

            <div>
              <div className="lp__footer-h">{f.onChain}</div>
              {onChain.map((c) => (
                <a
                  className="lp__link"
                  key={c.label}
                  href={`${EXPLORER}/${c.kind ?? "contract"}/${c.id}`}
                  target="_blank"
                  rel="noreferrer"
                  title={c.id}
                >
                  {c.label} ↗
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="lp__footer-row" style={{ marginTop: 30 }}>
          <span className="lp__badge">{f.badge}</span>
          <span>{f.openSource}</span>
          <span>
            {f.totals
              .replace("%c", campaigns ? String(campaigns.length) : "—")
              .replace("%a", campaigns ? fromStroops(raised) : "—")}
          </span>
        </div>

        <div className="lp__footer-row" style={{ marginTop: 14 }}>
          <span>{f.author}</span>
          <span>{f.event}</span>
        </div>
      </div>
    </footer>
  );
}
