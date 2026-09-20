"use client";

import { useCopy } from "@/lib/copy/context";

/** "No crypto required", as a promise rather than a mechanism. The words muxed, anchor, SEP
 *  and trustline all live in the README — a participant does not buy a protocol, they buy not
 *  having to learn one. */
export default function Privacy() {
  const { privacy: p } = useCopy();
  return (
    <section className="lp__section lp__divide lp__privacy" id="privacy">
      <div className="lp__in">
        <h2 className="lp__reveal--head">{p.title}</h2>
        <p className="lp__lede lp__reveal">{p.lede}</p>

        <div className="lp__cards">
          {p.cards.map((card, i) => (
            <div className={`lp__card${i === 2 ? " lp__card--ok" : ""} lp__reveal`} key={card.k}>
              <div className="lp__k">{card.k}</div>
              <div className="lp__v">{card.v}</div>
              <div className="lp__k" style={{ marginTop: 12 }}>
                {card.note}
              </div>
            </div>
          ))}
        </div>

        <p className="lp__k lp__reveal" style={{ marginTop: 26 }}>
          <a
            className="lp__link"
            href="https://github.com/sayweer/stello#readme"
            target="_blank"
            rel="noreferrer"
          >
            {p.link}
          </a>
        </p>
      </div>
    </section>
  );
}
