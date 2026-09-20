const EXPLORER = "https://stellar.expert/explorer/testnet";

/** The live run this section describes: a throwaway router + campaign pair on testnet, driven
 *  by `scripts/smoke-contracts.sh`. Linked so the story below is checkable, not claimed. */
const PROOF_ROUTER = "CDAFSA7J3ZFXGWMPENE2CNN3POJPGUF5EKNTJZVX65JEWZ36URYRTAW3";
const PROOF_CAMPAIGN = "CAKHF4ADAJI4DFEWBD6KXLYJ7CFTZ4W5OBYGZ2ULNESFVDX4CAHWF22H";

/** A real refund, shown before anything is explained. */
export default function Proof() {
  return (
    <section className="lp__section lp__divide lp__proof" id="proof">
      <i className="lp__sheet" aria-hidden="true" />
      <div className="lp__in">
        <h2 className="lp__reveal--head">Hedef tutmadı. Para kendiliğinden geri döndü.</h2>
        <p className="lp__lede lp__reveal">
          Söz değil — kayıt. Aşağıdaki tur test ağında gerçekten koştu; her adımı isteyen herkes
          zincirden kontrol edebilir.
        </p>

        <div className="lp__cards">
          <div className="lp__card lp__card--ok lp__reveal">
            <div className="lp__k">Taahhüt edildi</div>
            <div className="lp__v">
              5 <small>/ 100 hedef</small>
            </div>
            <div className="lp__bar">
              <i style={{ width: "5%" }} />
            </div>
            <div className="lp__k">süre doldu, hedef tutmadı</div>
          </div>

          <div className="lp__card lp__card--blocked lp__reveal">
            <div className="lp__k">Süre dolduktan sonra gelen havale</div>
            <div className="lp__v lp__v--red">İade</div>
            <div>
              <span className="lp__pill">3 birim · aynı işlemde geri gitti</span>
            </div>
          </div>

          <div className="lp__card lp__card--ok lp__reveal">
            <div className="lp__k">Katılımcıya dönen</div>
            <div className="lp__v" style={{ fontSize: 20 }}>
              5 / 5 — tamamı
            </div>
            <div className="lp__k" style={{ marginTop: 12 }}>
              imzasına gerek kalmadan
            </div>
          </div>
        </div>

        <div className="lp__jail">
          <h3 className="lp__jail-h">Katılımcı hiçbir şey yapmadı. Parası yine de döndü.</h3>
          <p className="lp__lede" style={{ marginBottom: 22 }}>
            Varsayım değil — test ağında, gerçek bir kampanyada koştu. An be an:
          </p>
          <ol className="lp__jail-steps">
            <li>
              Süre doldu, hedef tutmadı. Katılımcı <em>uygulamayı açmadı bile.</em>
            </li>
            <li>İadeyi bambaşka bir hesap tetikledi — kontrat kimin tetiklediğine bakmıyor.</li>
            <li>
              Para çağırana değil, katılımcının kendi hesabına gitti.{" "}
              <strong>Kuruşu kuruşuna.</strong>
            </li>
          </ol>
          <p className="lp__k" style={{ marginTop: 18 }}>
            Tek işlem, birkaç saniye — Eylül 2026, Stellar testnet.
          </p>
        </div>

        <p className="lp__k lp__reveal" style={{ marginTop: 26 }}>
          <a
            className="lp__link"
            href={`${EXPLORER}/contract/${PROOF_CAMPAIGN}`}
            target="_blank"
            rel="noreferrer"
          >
            İadeyi explorer'da gör ↗
          </a>
          {" · "}
          <a
            className="lp__link"
            href={`${EXPLORER}/contract/${PROOF_ROUTER}`}
            target="_blank"
            rel="noreferrer"
          >
            Yönlendirici kontrat ↗
          </a>
        </p>
      </div>
    </section>
  );
}
