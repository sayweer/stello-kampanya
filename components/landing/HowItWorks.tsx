/** Three steps, one sentence each — what the participant actually does. Staged as the
 *  reference's pinned scene: three lines arrive from alternating sides, split apart, scale
 *  down together, and only then does the copy fill in on scrub. */
const STEPS = [
  {
    n: "01",
    t: "Havaleni gönder",
    d: "Kampanyanın IBAN'ına, sana özel açıklama koduyla. Kurulacak cüzdan yok, saklanacak kelime yok, önce alınacak kripto yok.",
  },
  {
    n: "02",
    t: "Zincirde yerini al",
    d: "Para ulaştığı anda katılımın kontrata yazılır. Sayaç herkesin önünde akar; kimse listeyi elle tutmaz.",
  },
  {
    n: "03",
    t: "Ya olur ya kazanırsın",
    d: "Hedef tutarsa iş olur. Tutmazsa paran ve bonustan payın hesabına döner — sen bir şey yapmadan.",
  },
];

export default function HowItWorks() {
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
        <h2 className="lp__reveal--head">Nasıl çalışır</h2>
        <p className="lp__lede lp__reveal">
          Senin yaptığın tek şey bir havale. Gerisini kontrat takip eder.
        </p>

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
            Nasıl kuruldu →
          </a>
        </p>
      </div>
    </section>
  );
}
