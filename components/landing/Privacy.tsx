/** "No crypto required", as a promise rather than a mechanism. The words muxed, anchor, SEP
 *  and trustline all live in the README — a participant does not buy a protocol, they buy not
 *  having to learn one. */
export default function Privacy() {
  return (
    <section className="lp__section lp__divide lp__privacy" id="privacy">
      <div className="lp__in">
        <h2 className="lp__reveal--head">Zincirin güvencesini al — zinciri öğrenmeden.</h2>
        <p className="lp__lede lp__reveal">
          Katılmak için bildiğin tek şeyi yapıyorsun: havale. Cüzdan kurmak, kelime saklamak,
          borsadan kripto almak yok. Yine de paranın kuralı bir şirketin sözü değil, herkesin
          okuyabildiği bir kontrat.
        </p>

        <div className="lp__cards">
          <div className="lp__card lp__reveal">
            <div className="lp__k">Cüzdan</div>
            <div className="lp__v">•••••</div>
            <div className="lp__k" style={{ marginTop: 12 }}>gerekmiyor</div>
          </div>
          <div className="lp__card lp__reveal">
            <div className="lp__k">Kripto satın almak</div>
            <div className="lp__v">•••••</div>
            <div className="lp__k" style={{ marginTop: 12 }}>gerekmiyor</div>
          </div>
          <div className="lp__card lp__card--ok lp__reveal">
            <div className="lp__k">Katılımın</div>
            <div className="lp__v">Kayıtlı</div>
            <div className="lp__k" style={{ marginTop: 12 }}>zincirde, herkese açık</div>
          </div>
        </div>

        <p className="lp__k lp__reveal" style={{ marginTop: 26 }}>
          <a
            className="lp__link"
            href="https://github.com/sayweer/stello#readme"
            target="_blank"
            rel="noreferrer"
          >
            Havale nasıl kontrat çağrısına dönüşüyor →
          </a>
        </p>
      </div>
    </section>
  );
}
