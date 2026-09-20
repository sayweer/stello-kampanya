/** The four checks, in plain language. Laid out together rather than as a carousel, because
 *  the argument is about the set: each one closes a way the promise could be broken. */
const ITEMS = [
  {
    n: "01",
    t: "Bonus baştan kilitli",
    d: "Organizatör bonusu kontrata yatırmadan kampanya katılıma açılmaz. Söz laf olarak değil, para olarak durur.",
  },
  {
    n: "02",
    t: "Kişi başı tavan",
    d: "Bonus payı kişi başı bir tavana kadar sayılır. Son dakikada büyük para koyup bonusu toplamak işe yaramaz.",
  },
  {
    n: "03",
    t: "İade imza istemez",
    d: "Parayı geri göndermeyi herkes tetikleyebilir ama para yalnız sahibine gider. Telefonunu kaybeden de parasını alır.",
  },
  {
    n: "04",
    t: "Aynı havale iki kez sayılmaz",
    d: "Her ödemenin zincirde tek bir kimliği var. Aktarıcı iki kez çalışsa da kontrat ikincisini reddeder.",
  },
];

export default function Guarantees() {
  return (
    <section className="lp__section lp__divide" id="guarantees">
      <div className="lp__in">
        <h2 className="lp__reveal--head">Kontratın zorla uyguladığı dört şey</h2>
        <p className="lp__lede lp__reveal">
          Bir uygulamadaki ayarlar değil, birinin "merak etme" demesi hiç değil. Para hareket
          etmeden önce kontratın baktığı kurallar.
        </p>

        <div className="lp__guards">
          {ITEMS.map((it) => (
            <article className="lp__guard" key={it.n}>
              <span className="lp__guard-n">{it.n}</span>
              <h3 className="lp__guard-t">{it.t}</h3>
              <p className="lp__guard-d">{it.d}</p>
            </article>
          ))}
        </div>

        <div className="lp__guard-key">
          <p>
            "Yeterli kişi olursa" işlerinde herkes başkasının önce davranmasını bekler.{" "}
            <strong>Burada beklemenin ödülü yok, katılmanın var.</strong> Ürün o fark.
          </p>
          <a
            className="lp__link"
            href="https://github.com/sayweer/stello/tree/main/contracts"
            target="_blank"
            rel="noreferrer"
          >
            Kontrat mekaniği →
          </a>
        </div>
      </div>
    </section>
  );
}
