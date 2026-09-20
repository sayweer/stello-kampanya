"use client";

import { useCopy } from "@/lib/copy/context";

/** The page's single dark block. Colour earns its weight by being rare. */
export default function FinalCta({ onEnter, onCreate }: { onEnter: () => void; onCreate: () => void }) {
  const { finalCta: f } = useCopy();
  return (
    <section className="lp__section">
      <div className="lp__in">
        <div className="lp__final lp__reveal">
          <h2>{f.title}</h2>
          <p className="lp__lede">{f.lede}</p>
          <div className="lp__actions">
            <button className="lp__cta" onClick={onEnter} type="button">
              {f.browse}
            </button>
            <button className="lp__cta lp__cta--ghost" onClick={onCreate} type="button">
              {f.create}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
