/** The page's single dark block. Colour earns its weight by being rare. */
export default function FinalCta({ onEnter, onCreate }: { onEnter: () => void; onCreate: () => void }) {
  return (
    <section className="lp__section">
      <div className="lp__in">
        <div className="lp__final lp__reveal">
          <h2>Bir havale uzağındasın.</h2>
          <p className="lp__lede">
            Kurulacak cüzdan yok, saklanacak kelime yok, önce alınacak kripto yok. Bir kampanya
            seç, IBAN'a gönder; gerisini kontrat takip eder.
          </p>
          <div className="lp__actions">
            <button className="lp__cta" onClick={onEnter} type="button">
              Kampanyalara bak
            </button>
            <button className="lp__cta lp__cta--ghost" onClick={onCreate} type="button">
              Kampanya aç →
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
