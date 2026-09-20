"use client";

import { useCopy } from "@/lib/copy/context";

/** Three steps, one sentence each — what the participant actually does. Staged as the
 *  reference's pinned scene: three lines arrive from alternating sides, split apart, scale
 *  down together, and only then does the copy fill in on scrub. */

export default function HowItWorks() {
  const { how } = useCopy();
  const STEPS = how.steps;
  return (
    <section className="lp__section lp__divide lp__how" id="how">
      <div className="lp__scene" aria-hidden="true">
        {STEPS.map((s) => (
          <div className="lp__scene-line" key={s.n}>
            {s.t}
          </div>
        ))}
      </div>

      <div className="lp__in lp__how-copy">
        <h2 className="lp__reveal--head">{how.title}</h2>
        <p className="lp__lede lp__reveal">{how.lede}</p>

        <div className="lp__steps">
          {STEPS.map((s) => (
            <div className="lp__step" key={s.n}>
              <i className="lp__step-rule" aria-hidden="true" />
              <div className="lp__step-n-mask">
                <div className="lp__step-n">{s.n}</div>
              </div>
              <div className="lp__step-b">
                <h3 className="lp__sr">{s.t}</h3>
                <p className="lp__fill-text">{s.d}</p>
              </div>
            </div>
          ))}
        </div>

        <p className="lp__k lp__reveal" style={{ marginTop: 24 }}>
          <a
            className="lp__link"
            href="https://github.com/sayweer/stello#readme"
            target="_blank"
            rel="noreferrer"
          >
            {how.link}
          </a>
        </p>
      </div>
    </section>
  );
}
