# Ya olur, ya kazanırsın

A crowdfunding campaign people join with an ordinary bank transfer. If the goal is met, the organizer takes the proceeds. **If it is missed, everyone gets their money back plus a share of a bonus the organizer locked up front** — so being early is the rational move instead of waiting to see what everyone else does.

Built on [`stello-sdk`](https://github.com/sayweer/stello): a separate project, installed as a package. This repository has no source dependency on it — not even for the integration test, which registers Stello's router from its compiled `router.wasm`.

> Stellar testnet, against a mock Turkish anchor. Bank transfers and KYC are simulated.

## What the participant sees

An IBAN and a reference code. No wallet, no seed phrase, no exchange. The Stellar account is created in their browser and they never hear about it.

## How it uses Stello

```ts
// lib/campaign/flows.ts
const stello = new Stello({ route: campaignConfig.routeId, relayUrl: campaignConfig.relayUrl });

// A pledge is just a deposit whose argument bytes say "pledge, campaign 7".
const handle = await stello.requestDeposit({
  keypair,
  arg: encodeArg(KIND_PLEDGE, campaignId),
  amountTry: "250",
});
```

The campaign contract implements the one function Stello asks for:

```rust
pub fn on_deposit(env: Env, user: Address, amount: i128, arg: Bytes) -> bool {
    let router: Address = env.storage().instance().get(&DataKey::Router).unwrap();
    router.require_auth();   // only the router may say money arrived
    // ... record the pledge, or refund and return false
}
```

Everything specific to the campaign lives in `contracts/campaign` and `lib/campaign`. Everything about moving money lives in the SDK.

## The rules the contract enforces

| | |
|---|---|
| **Bonus locked first** | The campaign does not open for pledges until the organizer's bonus is actually in the contract. |
| **Per-person cap** | A bonus share is counted up to a cap per person, so a large last-minute pledge cannot sweep the bonus. |
| **Refunds need no signature** | `claim` pays the pledger, whoever calls it. A whole room can be refunded by one person — or by the organizer, or by nobody's phone at all. |
| **A transfer counts once** | Every payment carries an on-chain identity; a relay running twice cannot pay twice. |

## Running it

```bash
pnpm install          # pulls stello-sdk from npm
pnpm dev              # http://localhost:3001

cargo test            # 21 contract tests
stellar contract build
```

`NEXT_PUBLIC_STELLO_RELAY_URL` points at Stello's relay so a pledge lands without waiting for its next pass. This app never holds the landing account's key.

The SDK is an ordinary registry dependency — [`stello-sdk`](https://www.npmjs.com/package/stello-sdk) — so this app needs no path to the Stello repository. Upgrade it with `pnpm add stello-sdk@latest`.

## On testnet

| | |
|---|---|
| Campaign contract | `CC5OFUN4SOUJLXQ6N45SHWRUXX5BRHOS5ONN4P3FQYTU6WFS5BOAKRHV` |
| Route on Stello's router | `1` |

## License

MIT
