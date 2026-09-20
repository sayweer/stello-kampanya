import { config, fromStroops } from "stello-sdk";
import { campaignConfig, type CampaignView } from "@/lib/campaign";

import StelloMark from "../StelloMark";

const EXPLORER = "https://stellar.expert/explorer/testnet";
const REPO = "https://github.com/sayweer/stello";

/** The footer carries the trust apparatus: a product that says "don't trust us, check the
 *  chain" has to say where to check. */
const ON_CHAIN = [
  { label: "Yönlendirici kontrat", id: config.routerId },
  { label: "Kampanya kontratı", id: campaignConfig.campaignId },
  { label: "İniş hesabı", id: config.landing, kind: "account" },
];

export default function Footer({ campaigns }: { campaigns: CampaignView[] | null }) {
  const raised = (campaigns ?? []).reduce((sum, c) => sum + c.total, 0n);

  return (
    <footer className="lp__footer">
      <div className="lp__in">
        <div className="lp__footer-top">
          <div>
            <strong className="lp__footer-brand">
              <StelloMark size={18} />
              Stello
            </strong>
            <p className="lp__footer-line">
              Banka havalesi, kontrat çağrısı olur — kuralların bir sözde değil, kontratta durur.
            </p>
          </div>

          <div className="lp__footer-cols">
            <div>
              <div className="lp__footer-h">Ürün</div>
              <a className="lp__link" href="#campaigns">
                Kampanyalar
              </a>
              <a className="lp__link" href="#new">
                Kampanya aç
              </a>
            </div>

            <div>
              <div className="lp__footer-h">Kaynaklar</div>
              <a className="lp__link" href={REPO} target="_blank" rel="noreferrer">
                GitHub ↗
              </a>
              <a className="lp__link" href={`${REPO}#readme`} target="_blank" rel="noreferrer">
                Mimari ve güven modeli ↗
              </a>
            </div>

            <div>
              <div className="lp__footer-h">Zincirde</div>
              {ON_CHAIN.map((c) => (
                <a
                  className="lp__link"
                  key={c.label}
                  href={`${EXPLORER}/${c.kind ?? "contract"}/${c.id}`}
                  target="_blank"
                  rel="noreferrer"
                  title={c.id}
                >
                  {c.label} ↗
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="lp__footer-row" style={{ marginTop: 30 }}>
          <span className="lp__badge">Stellar Testnet</span>
          <span>Açık kaynak, her satırı okunabilir.</span>
          <span>
            {campaigns ? campaigns.length : "—"} kampanya ·{" "}
            {campaigns ? fromStroops(raised) : "—"} USDC taahhüt — hepsi yukarıdan kontrol
            edilebilir.
          </span>
        </div>

        <div className="lp__footer-row" style={{ marginTop: 14 }}>
          <span>Seyit Ali Değirmen tarafından yapıldı</span>
          <span>Stellar Pro Hackathon · İstanbul, Eylül 2026</span>
        </div>
      </div>
    </footer>
  );
}
