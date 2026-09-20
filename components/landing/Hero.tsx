"use client";

import { fromStroops } from "stello-sdk";
import type { CampaignView } from "@/lib/campaign";

import Words from "./Words";
import { useTheme } from "./useTheme";
import StelloMark from "../StelloMark";
import LangSwitch from "../LangSwitch";
import { useCopy } from "@/lib/copy/context";

/** The brand name split where the curtain parts. Each half is pinned to the inner edge of its
 *  panel, so as the gap opens the two halves are carried off screen with it. */
const BRAND_START = "Ste";
const BRAND_END = "llo";

const loaderChars = (word: string, keyBase: string) =>
  [...word].map((ch, i) => (
    <span className="lp__load-char" key={`${keyBase}-${i}`}>
      {ch}
    </span>
  ));

/** The opening screen — a full-height scene, not a padded band. Markup follows the reference
 *  one to one so `useReveal` can drive it unchanged; only the words and the doors differ. */
export default function Hero({
  campaigns,
  address,
  onEnter,
  onCreate,
}: {
  /** Live chain data — the counter never shows an invented number. */
  campaigns: CampaignView[] | null;
  /** This browser's account, if it has one already. */
  address: string | null;
  /** Into the app: the campaign list. */
  onEnter: () => void;
  /** Into the app: the organizer's form. */
  onCreate: () => void;
}) {
  const { theme, toggle } = useTheme();
  const { hero, nav } = useCopy();

  const raised = (campaigns ?? []).reduce((sum, c) => sum + c.total, 0n);
  const people = (campaigns ?? []).reduce((sum, c) => sum + c.pledgers, 0);

  return (
    <section className="lp__section lp__hero">
      <div className="lp__curtain" aria-hidden="true">
        <i className="lp__curtain-fill" />
        <div className="lp__curtain-half lp__curtain-half--l">
          <span className="lp__brand-start">{loaderChars(BRAND_START, "s")}</span>
        </div>
        <div className="lp__curtain-half lp__curtain-half--r">
          <span className="lp__brand-end">{loaderChars(BRAND_END, "e")}</span>
        </div>
      </div>

      <div className="lp__hero-top">
        <nav className="lp__nav">
          <span className="lp__nav-mask">
            <span className="lp__nav-link lp__nav-brand">
              <StelloMark size={17} />
              Stello
            </span>
          </span>

          <span className="lp__nav-mid">
            {(
              [
                [nav.proof, "#proof"],
                [nav.how, "#how"],
                [nav.guarantees, "#guarantees"],
                [nav.privacy, "#privacy"],
              ] as const
            ).map(([label, href]) => (
              <span className="lp__nav-mask" key={href}>
                <a className="lp__nav-link" href={href}>
                  {label}
                </a>
              </span>
            ))}
          </span>

          <span className="lp__nav-end">
            <span className="lp__nav-mask lp__nav-aux">
              <a
                className="lp__nav-link"
                href="https://github.com/sayweer/stello"
                target="_blank"
                rel="noreferrer"
              >
                GitHub
              </a>
            </span>
            <span className="lp__nav-mask lp__nav-aux">
              <LangSwitch className="lp__nav-link" />
            </span>
            <span className="lp__nav-mask">
              <button
                className="lp__nav-link lp__theme"
                onClick={(e) => toggle(e)}
                type="button"
                aria-label={theme === "dark" ? nav.toLight : nav.toDark}
                title={theme === "dark" ? nav.light : nav.dark}
              >
                {theme === "dark" ? "☀" : "☾"}
              </button>
            </span>

            <span className="lp__nav-mask lp__nav-mask--chip">
              <span className="lp__nav-chip">
                {address ? (
                  <button className="anav__chip" onClick={onEnter} type="button">
                    {address.slice(0, 4)}…{address.slice(-4)}
                  </button>
                ) : (
                  <button className="anav__cta" onClick={onEnter} type="button">
                    {nav.campaigns}
                  </button>
                )}
              </span>
            </span>
          </span>
        </nav>
      </div>

      <div className="lp__hero-bottom">
        <div className="lp__rule" />
        <h1>
          <Words text={hero.headline} mark={hero.mark} />
        </h1>

        <div className="lp__rise-box">
          <p className="lp__lede lp__rise">{hero.lede}</p>
        </div>

        <div className="lp__rise-box">
          <div className="lp__actions lp__rise">
            {address ? (
              <button className="lp__cta" onClick={onEnter} type="button">
                {hero.back}
                <span className="lp__cta-hint">{hero.backHint}</span>
              </button>
            ) : (
              <>
                <button className="lp__cta" onClick={onEnter} type="button">
                  {hero.join}
                  <span className="lp__cta-hint">{hero.joinHint}</span>
                </button>
                <button className="lp__cta lp__cta--ghost" onClick={onCreate} type="button">
                  {hero.create}
                  <span className="lp__cta-hint">{hero.createHint}</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="lp__hero-foot">
        <i className="lp__counter-rule" aria-hidden="true" />
        <div className="lp__rise-box">
          <div className="lp__counter lp__rise">
            <span>
              <b>{campaigns ? campaigns.length : "—"}</b> {hero.countCampaigns}
            </span>
            <span>
              <b>{campaigns ? fromStroops(raised) : "—"}</b> {hero.countPledged}
            </span>
            <span>
              <b>{campaigns ? people : "—"}</b> {hero.countPeople}
            </span>
            <span className="lp__award">{hero.award}</span>
          </div>
        </div>
      </div>
    </section>
  );
}
