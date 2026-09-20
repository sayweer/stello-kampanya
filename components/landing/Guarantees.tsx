"use client";

import { useCopy } from "@/lib/copy/context";

/** The four checks, in plain language. Laid out together rather than as a carousel, because
 *  the argument is about the set: each one closes a way the promise could be broken. */

export default function Guarantees() {
  const { guarantees: g } = useCopy();
  return (
    <section className="lp__section lp__divide" id="guarantees">
      <div className="lp__in">
        <h2 className="lp__reveal--head">{g.title}</h2>
        <p className="lp__lede lp__reveal">{g.lede}</p>

        <div className="lp__guards">
          {g.items.map((it) => (
            <article className="lp__guard" key={it.n}>
              <span className="lp__guard-n">{it.n}</span>
              <h3 className="lp__guard-t">{it.t}</h3>
              <p className="lp__guard-d">{it.d}</p>
            </article>
          ))}
        </div>

        <div className="lp__guard-key">
          <p>
            {g.keyText}
            <strong>{g.keyStrong}</strong>
          </p>
          <a
            className="lp__link"
            href="https://github.com/sayweer/stello/tree/main/contracts"
            target="_blank"
            rel="noreferrer"
          >
            {g.link}
          </a>
        </div>
      </div>
    </section>
  );
}
