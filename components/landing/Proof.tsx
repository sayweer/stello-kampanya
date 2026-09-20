"use client";

import { useCopy } from "@/lib/copy/context";

const EXPLORER = "https://stellar.expert/explorer/testnet";

/** The live run this section describes: a throwaway router + campaign pair on testnet, driven
 *  by `scripts/smoke-contracts.sh`. Linked so the story below is checkable, not claimed. */
const PROOF_ROUTER = "CDAFSA7J3ZFXGWMPENE2CNN3POJPGUF5EKNTJZVX65JEWZ36URYRTAW3";
const PROOF_CAMPAIGN = "CAKHF4ADAJI4DFEWBD6KXLYJ7CFTZ4W5OBYGZ2ULNESFVDX4CAHWF22H";

/** A real refund, shown before anything is explained. */
/** `*italic*` and `**bold**`, so a translator can place the stress themselves. */
function emphasise(text: string) {
  return text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/).map((part, i) => {
    if (part.startsWith("**")) return <strong key={i}>{part.slice(2, -2)}</strong>;
    if (part.startsWith("*")) return <em key={i}>{part.slice(1, -1)}</em>;
    return part;
  });
}

export default function Proof() {
  const { proof: p } = useCopy();
  return (
    <section className="lp__section lp__divide lp__proof" id="proof">
      <i className="lp__sheet" aria-hidden="true" />
      <div className="lp__in">
        <h2 className="lp__reveal--head">{p.title}</h2>
        <p className="lp__lede lp__reveal">{p.lede}</p>

        <div className="lp__cards">
          <div className="lp__card lp__card--ok lp__reveal">
            <div className="lp__k">{p.pledgedLabel}</div>
            <div className="lp__v">
              5 <small>{p.pledgedOf}</small>
            </div>
            <div className="lp__bar">
              <i style={{ width: "5%" }} />
            </div>
            <div className="lp__k">{p.pledgedNote}</div>
          </div>

          <div className="lp__card lp__card--blocked lp__reveal">
            <div className="lp__k">{p.lateLabel}</div>
            <div className="lp__v lp__v--red">{p.lateValue}</div>
            <div>
              <span className="lp__pill">{p.latePill}</span>
            </div>
          </div>

          <div className="lp__card lp__card--ok lp__reveal">
            <div className="lp__k">{p.returnedLabel}</div>
            <div className="lp__v" style={{ fontSize: 20 }}>
              {p.returnedValue}
            </div>
            <div className="lp__k" style={{ marginTop: 12 }}>
              {p.returnedNote}
            </div>
          </div>
        </div>

        <div className="lp__jail">
          <h3 className="lp__jail-h">{p.jailTitle}</h3>
          <p className="lp__lede" style={{ marginBottom: 22 }}>
            {p.jailLede}
          </p>
          <ol className="lp__jail-steps">
            {p.jailSteps.map((step, i) => (
              <li key={i}>{emphasise(step)}</li>
            ))}
          </ol>
          <p className="lp__k" style={{ marginTop: 18 }}>
            {p.jailFoot}
          </p>
        </div>

        <p className="lp__k lp__reveal" style={{ marginTop: 26 }}>
          <a
            className="lp__link"
            href={`${EXPLORER}/contract/${PROOF_CAMPAIGN}`}
            target="_blank"
            rel="noreferrer"
          >
            {p.linkRefund}
          </a>
          {" · "}
          <a
            className="lp__link"
            href={`${EXPLORER}/contract/${PROOF_ROUTER}`}
            target="_blank"
            rel="noreferrer"
          >
            {p.linkRouter}
          </a>
        </p>
      </div>
    </section>
  );
}
