#![cfg(test)]
extern crate std;

use soroban_sdk::{
    testutils::{Address as _, Events as _, Ledger as _},
    token::{StellarAssetClient, TokenClient},
    Address, Bytes, BytesN, Env, Event as _, String,
};

use crate::{
    Campaigns, CampaignsClient, Error, Rejected, Status, KIND_BONUS, KIND_PLEDGE, REASON_BAD_ARG,
};

/// 1 USDC in stroops — keeps the test numbers readable.
const USDC: i128 = 10_000_000;
const DURATION: u64 = 3_600;

struct Ctx {
    env: Env,
    campaign_id: Address,
    usdc: Address,
    router: Address,
    organizer: Address,
    id: u64,
    deadline: u64,
}

impl Ctx {
    fn campaigns(&self) -> CampaignsClient<'_> {
        CampaignsClient::new(&self.env, &self.campaign_id)
    }

    fn token(&self) -> TokenClient<'_> {
        TokenClient::new(&self.env, &self.usdc)
    }

    fn user(&self) -> Address {
        Address::generate(&self.env)
    }

    fn arg(&self, kind: u8, id: u64) -> Bytes {
        arg(&self.env, kind, id)
    }

    /// Replays what the router does: the USDC is already here when
    /// `on_deposit` runs.
    fn deposit(&self, user: &Address, amount: i128, arg: &Bytes) -> bool {
        StellarAssetClient::new(&self.env, &self.usdc).mint(user, &amount);
        self.token().transfer(user, &self.campaign_id, &amount);
        self.campaigns().on_deposit(user, &amount, arg)
    }

    fn pledge(&self, user: &Address, amount: i128) -> bool {
        self.deposit(user, amount, &self.arg(KIND_PLEDGE, self.id))
    }

    fn fund_bonus(&self, amount: i128) -> bool {
        let organizer = self.organizer.clone();
        self.deposit(&organizer, amount, &self.arg(KIND_BONUS, self.id))
    }

    fn pass_deadline(&self) {
        self.env.ledger().set_timestamp(self.deadline + 1);
    }
}

fn arg(env: &Env, kind: u8, id: u64) -> Bytes {
    let mut raw = [0u8; 9];
    raw[0] = kind;
    raw[1..9].copy_from_slice(&id.to_be_bytes());
    Bytes::from_array(env, &raw)
}

fn setup(goal: i128, bonus: i128, cap: i128) -> Ctx {
    let env = Env::default();
    env.mock_all_auths();

    let issuer = Address::generate(&env);
    let usdc = env.register_stellar_asset_contract_v2(issuer).address();
    let router = Address::generate(&env);
    let organizer = Address::generate(&env);
    let campaign_id = env.register(Campaigns, (router.clone(), usdc.clone()));

    let deadline = env.ledger().timestamp() + DURATION;
    let id = CampaignsClient::new(&env, &campaign_id).create(
        &organizer,
        &String::from_str(&env, "Gece Pizzasi"),
        &goal,
        &deadline,
        &bonus,
        &cap,
    );

    Ctx {
        env,
        campaign_id,
        usdc,
        router,
        organizer,
        id,
        deadline,
    }
}

/// A live campaign: goal 100 USDC, bonus 10 USDC already locked, cap 4 USDC.
fn live() -> Ctx {
    let ctx = setup(100 * USDC, 10 * USDC, 4 * USDC);
    assert!(ctx.fund_bonus(10 * USDC));
    ctx
}

#[test]
fn create_validates_its_parameters() {
    let ctx = setup(100 * USDC, 0, 4 * USDC);
    let campaigns = ctx.campaigns();
    let title = String::from_str(&ctx.env, "x");
    let deadline = ctx.deadline;

    for (goal, bonus, cap, deadline) in [
        (0, 0, 4 * USDC, deadline),
        (100 * USDC, -1, 4 * USDC, deadline),
        (100 * USDC, 0, 0, deadline),
        (100 * USDC, 0, 4 * USDC, ctx.env.ledger().timestamp()),
    ] {
        assert_eq!(
            campaigns.try_create(&ctx.organizer, &title, &goal, &deadline, &bonus, &cap),
            Err(Ok(Error::InvalidParam))
        );
    }

    let long = String::from_str(
        &ctx.env,
        "0123456789012345678901234567890123456789012345678901234567890123456789",
    );
    assert_eq!(
        campaigns.try_create(&ctx.organizer, &long, &(100 * USDC), &deadline, &0, &(4 * USDC)),
        Err(Ok(Error::InvalidParam))
    );
}

#[test]
fn campaign_ids_are_sequential_and_countable() {
    let ctx = setup(100 * USDC, 0, 4 * USDC);
    let campaigns = ctx.campaigns();

    let second = campaigns.create(
        &ctx.organizer,
        &String::from_str(&ctx.env, "Atolye"),
        &(50 * USDC),
        &ctx.deadline,
        &0,
        &(4 * USDC),
    );

    assert_eq!((ctx.id, second), (1, 2));
    assert_eq!(campaigns.count(), 2);
    assert_eq!(campaigns.get_campaign(&second).unwrap().goal, 50 * USDC);
    assert_eq!(campaigns.get_campaign(&99), None);
}

#[test]
fn a_campaign_is_not_live_until_the_bonus_is_locked() {
    let ctx = setup(100 * USDC, 10 * USDC, 4 * USDC);
    let user = ctx.user();

    // Bonus only half funded: pledges are refunded, not recorded.
    assert!(ctx.fund_bonus(6 * USDC));
    assert!(!ctx.pledge(&user, 2 * USDC));
    assert_eq!(ctx.token().balance(&user), 2 * USDC);
    assert_eq!(ctx.campaigns().get_pledge(&ctx.id, &user), None);

    // Topping the bonus up makes it live; this time nothing bounces back.
    assert!(ctx.fund_bonus(4 * USDC));
    let refunded_earlier = ctx.token().balance(&user);
    assert!(ctx.pledge(&user, 2 * USDC));
    assert_eq!(ctx.token().balance(&user), refunded_earlier);
    assert_eq!(
        ctx.campaigns().get_pledge(&ctx.id, &user).unwrap().amount,
        2 * USDC
    );
    assert_eq!(
        ctx.campaigns().get_campaign(&ctx.id).unwrap().bonus_funded,
        10 * USDC
    );
}

#[test]
fn only_the_organizer_funds_the_bonus_and_never_more_than_asked() {
    let ctx = setup(100 * USDC, 10 * USDC, 4 * USDC);
    let stranger = ctx.user();

    // A stranger's bonus transfer bounces straight back.
    assert!(!ctx.deposit(&stranger, 10 * USDC, &ctx.arg(KIND_BONUS, ctx.id)));
    assert_eq!(ctx.token().balance(&stranger), 10 * USDC);
    assert_eq!(ctx.campaigns().get_campaign(&ctx.id).unwrap().bonus_funded, 0);

    // The organizer overshoots: only the missing part is kept.
    assert!(ctx.fund_bonus(15 * USDC));
    assert_eq!(
        ctx.campaigns().get_campaign(&ctx.id).unwrap().bonus_funded,
        10 * USDC
    );
    assert_eq!(ctx.token().balance(&ctx.organizer), 5 * USDC);

    // Nothing left to fund.
    assert!(!ctx.fund_bonus(1 * USDC));
    assert_eq!(ctx.token().balance(&ctx.organizer), 6 * USDC);
}

#[test]
fn unusable_deposits_are_refunded_in_full() {
    let ctx = live();
    let user = ctx.user();
    let campaigns = ctx.campaigns();

    // Malformed payload.
    assert!(!ctx.deposit(&user, USDC, &Bytes::from_array(&ctx.env, &[9u8, 9])));
    // Unknown campaign.
    assert!(!ctx.deposit(&user, USDC, &ctx.arg(KIND_PLEDGE, 404)));
    // Unknown kind.
    assert!(!ctx.deposit(&user, USDC, &ctx.arg(7, ctx.id)));

    assert_eq!(ctx.token().balance(&user), 3 * USDC);
    assert_eq!(ctx.token().balance(&ctx.campaign_id), 10 * USDC); // just the bonus
    assert_eq!(campaigns.get_pledge(&ctx.id, &user), None);

    // After the deadline, and after settling, pledges bounce too.
    ctx.pass_deadline();
    assert!(!ctx.pledge(&user, USDC));
    campaigns.settle(&ctx.id);
    assert!(!ctx.pledge(&user, USDC));
    assert_eq!(ctx.token().balance(&user), 5 * USDC);
}

#[test]
fn pledges_accumulate_and_weights_respect_the_cap() {
    let ctx = live();
    let campaigns = ctx.campaigns();
    let user = ctx.user();

    ctx.pledge(&user, 3 * USDC);
    ctx.pledge(&user, 3 * USDC);

    let pledge = campaigns.get_pledge(&ctx.id, &user).unwrap();
    assert_eq!(pledge.amount, 6 * USDC);
    assert!(!pledge.claimed);

    let campaign = campaigns.get_campaign(&ctx.id).unwrap();
    assert_eq!(campaign.total, 6 * USDC);
    assert_eq!(campaign.weight_sum, 4 * USDC); // capped
    assert_eq!(campaign.pledgers, 1);
}

#[test]
fn every_pledger_is_indexed_once() {
    let ctx = live();
    let campaigns = ctx.campaigns();
    let (a, b) = (ctx.user(), ctx.user());

    ctx.pledge(&a, USDC);
    ctx.pledge(&b, USDC);
    ctx.pledge(&a, USDC);

    assert_eq!(campaigns.get_campaign(&ctx.id).unwrap().pledgers, 2);
    assert_eq!(campaigns.pledger_at(&ctx.id, &0), Some(a));
    assert_eq!(campaigns.pledger_at(&ctx.id, &1), Some(b));
    assert_eq!(campaigns.pledger_at(&ctx.id, &2), None);
}

#[test]
fn settling_is_gated_by_the_deadline_and_idempotent() {
    let ctx = live();
    let campaigns = ctx.campaigns();
    ctx.pledge(&ctx.user(), 2 * USDC);

    assert_eq!(campaigns.try_settle(&ctx.id), Err(Ok(Error::TooEarly)));

    ctx.pass_deadline();
    assert_eq!(campaigns.settle(&ctx.id), Status::Failed);
    assert_eq!(campaigns.settle(&ctx.id), Status::Failed);
    assert_eq!(campaigns.try_settle(&404), Err(Ok(Error::NotFound)));
}

#[test]
fn reaching_the_goal_marks_the_campaign_successful() {
    let ctx = setup(2 * USDC, 0, 4 * USDC);
    let campaigns = ctx.campaigns();

    ctx.pledge(&ctx.user(), 2 * USDC);
    ctx.pass_deadline();

    assert_eq!(campaigns.settle(&ctx.id), Status::Succeeded);
}

#[test]
fn a_missed_goal_pays_pledge_plus_a_capped_bonus_share() {
    let ctx = live();
    let campaigns = ctx.campaigns();
    let (small, medium, whale) = (ctx.user(), ctx.user(), ctx.user());

    ctx.pledge(&small, 2 * USDC);
    ctx.pledge(&medium, 4 * USDC);
    ctx.pledge(&whale, 10 * USDC);
    // weights 2 + 4 + 4 = 10, bonus 10 USDC → 1 USDC per weight unit.
    ctx.pass_deadline();

    assert_eq!(campaigns.claim(&ctx.id, &small), 4 * USDC);
    assert_eq!(campaigns.claim(&ctx.id, &medium), 8 * USDC);
    assert_eq!(campaigns.claim(&ctx.id, &whale), 14 * USDC);

    assert_eq!(ctx.token().balance(&small), 4 * USDC);
    assert_eq!(ctx.token().balance(&whale), 14 * USDC);
    // Everything paid out: 16 USDC of pledges + 10 USDC of bonus.
    assert_eq!(ctx.token().balance(&ctx.campaign_id), 0);
}

#[test]
fn the_bonus_split_never_overpays_when_it_does_not_divide_evenly() {
    let ctx = setup(100 * USDC, 10 * USDC, 4 * USDC);
    ctx.fund_bonus(10 * USDC);
    let campaigns = ctx.campaigns();
    let (a, b, c) = (ctx.user(), ctx.user(), ctx.user());

    ctx.pledge(&a, USDC);
    ctx.pledge(&b, USDC);
    ctx.pledge(&c, USDC);
    ctx.pass_deadline();

    let paid = campaigns.claim(&ctx.id, &a)
        + campaigns.claim(&ctx.id, &b)
        + campaigns.claim(&ctx.id, &c);

    assert!(paid <= 3 * USDC + 10 * USDC);
    // The rounding dust stays behind and is never counted as revenue.
    assert_eq!(ctx.token().balance(&ctx.campaign_id), 13 * USDC - paid);
    assert!(ctx.token().balance(&ctx.campaign_id) < 3);
}

#[test]
fn anyone_can_trigger_a_refund_and_it_always_pays_the_pledger() {
    let ctx = live();
    let campaigns = ctx.campaigns();
    let user = ctx.user();
    let stranger = ctx.user();
    ctx.pledge(&user, 2 * USDC);
    ctx.pass_deadline();

    // No settle() call, no signature from `user`: a stranger refunds the room.
    ctx.env.mock_auths(&[]);
    let payout = campaigns.claim(&ctx.id, &user);

    assert_eq!(payout, 12 * USDC); // 2 pledged + the whole 10 bonus
    assert_eq!(ctx.token().balance(&user), 12 * USDC);
    assert_eq!(ctx.token().balance(&stranger), 0);
    assert_eq!(
        campaigns.get_campaign(&ctx.id).unwrap().status,
        Status::Failed
    );
}

#[test]
fn claiming_is_guarded() {
    let ctx = live();
    let campaigns = ctx.campaigns();
    let user = ctx.user();
    let nobody = ctx.user();
    ctx.pledge(&user, 2 * USDC);

    assert_eq!(
        campaigns.try_claim(&ctx.id, &user),
        Err(Ok(Error::TooEarly))
    );

    ctx.pass_deadline();
    campaigns.claim(&ctx.id, &user);
    assert_eq!(
        campaigns.try_claim(&ctx.id, &user),
        Err(Ok(Error::AlreadyClaimed))
    );
    assert_eq!(
        campaigns.try_claim(&ctx.id, &nobody),
        Err(Ok(Error::NotFound))
    );
}

#[test]
fn a_successful_campaign_pays_the_organizer_and_refuses_claims() {
    let ctx = setup(2 * USDC, 1 * USDC, 4 * USDC);
    let campaigns = ctx.campaigns();
    let user = ctx.user();
    ctx.fund_bonus(1 * USDC);
    ctx.pledge(&user, 3 * USDC);
    ctx.pass_deadline();

    assert_eq!(
        campaigns.try_claim(&ctx.id, &user),
        Err(Ok(Error::BadState))
    );

    // Pledges plus the organizer's own bonus come back to them.
    assert_eq!(campaigns.withdraw_proceeds(&ctx.id), 4 * USDC);
    assert_eq!(ctx.token().balance(&ctx.organizer), 4 * USDC);
    assert_eq!(ctx.token().balance(&ctx.campaign_id), 0);
    assert_eq!(
        campaigns.try_withdraw_proceeds(&ctx.id),
        Err(Ok(Error::AlreadyClaimed))
    );
}

#[test]
fn proceeds_need_the_organizers_signature() {
    let ctx = setup(2 * USDC, 0, 4 * USDC);
    ctx.pledge(&ctx.user(), 2 * USDC);
    ctx.pass_deadline();

    ctx.env.mock_auths(&[]);
    assert!(ctx.campaigns().try_withdraw_proceeds(&ctx.id).is_err());
    assert_eq!(ctx.token().balance(&ctx.organizer), 0);
}

#[test]
fn an_unused_bonus_goes_back_to_the_organizer() {
    let ctx = live();
    let campaigns = ctx.campaigns();
    ctx.pass_deadline();

    assert_eq!(campaigns.reclaim_bonus(&ctx.id), 10 * USDC);
    assert_eq!(ctx.token().balance(&ctx.organizer), 10 * USDC);
    assert_eq!(
        campaigns.try_reclaim_bonus(&ctx.id),
        Err(Ok(Error::BadState))
    );
}

#[test]
fn the_bonus_cannot_be_reclaimed_once_someone_pledged() {
    let ctx = live();
    ctx.pledge(&ctx.user(), USDC);
    ctx.pass_deadline();

    assert_eq!(
        ctx.campaigns().try_reclaim_bonus(&ctx.id),
        Err(Ok(Error::BadState))
    );
}

#[test]
fn only_the_router_may_report_deposits() {
    let ctx = live();
    let user = ctx.user();
    let arg = ctx.arg(KIND_PLEDGE, ctx.id);

    ctx.env.mock_auths(&[]);
    assert!(ctx
        .campaigns()
        .try_on_deposit(&user, &(2 * USDC), &arg)
        .is_err());
    assert_eq!(ctx.campaigns().get_pledge(&ctx.id, &user), None);
    // The configured router is the only address that can authorize it.
    assert!(ctx.router != user);
}

#[test]
fn quote_matches_what_claim_pays() {
    let ctx = live();
    let campaigns = ctx.campaigns();
    let user = ctx.user();
    ctx.pledge(&user, 2 * USDC);

    let quoted = campaigns.quote_claim(&ctx.id, &user);
    ctx.pass_deadline();

    assert_eq!(campaigns.claim(&ctx.id, &user), quoted);
    assert_eq!(campaigns.quote_claim(&ctx.id, &user), 0); // already claimed
    assert_eq!(campaigns.quote_claim(&ctx.id, &ctx.user()), 0);
}

#[test]
fn rejected_deposits_report_a_reason() {
    let ctx = live();
    let user = ctx.user();

    assert!(!ctx.deposit(&user, USDC, &Bytes::from_array(&ctx.env, &[0u8])));

    // The event carries the machine-readable reason the client turns into a
    // Turkish message; the campaign id is unknown for a malformed payload.
    let expected = Rejected {
        campaign: 0,
        user,
        amount: USDC,
        reason: REASON_BAD_ARG,
    };
    assert_eq!(
        ctx.env.events().all().filter_by_contract(&ctx.campaign_id),
        std::vec![expected.to_xdr(&ctx.env, &ctx.campaign_id)]
    );
}

/// The real thing: router and campaign wired together, money flowing from the
/// relayer's account all the way to a pledger's refund.
#[test]
fn router_and_campaign_run_a_full_round() {
    // The router is another team's contract, so the test uses its compiled
    // interface rather than its source — exactly what an integrating app has.
    mod stello_router {
        soroban_sdk::contractimport!(file = "router.wasm");
    }
    use stello_router::{Client as RouterClient, WASM as ROUTER_WASM};

    let env = Env::default();
    env.mock_all_auths();

    let issuer = Address::generate(&env);
    let usdc = env.register_stellar_asset_contract_v2(issuer).address();
    let relayer = Address::generate(&env);
    let organizer = Address::generate(&env);
    let user = Address::generate(&env);

    let router_id = env.register(ROUTER_WASM, (relayer.clone(), usdc.clone()));
    let campaign_id = env.register(Campaigns, (router_id.clone(), usdc.clone()));
    let router = RouterClient::new(&env, &router_id);
    let campaigns = CampaignsClient::new(&env, &campaign_id);
    let token = TokenClient::new(&env, &usdc);

    // The landing account holds what the anchor delivered.
    StellarAssetClient::new(&env, &usdc).mint(&relayer, &(100 * USDC));

    let route = router.register_route(
        &organizer,
        &campaign_id,
        &String::from_str(&env, "Ya Olur Ya Kazanirsin"),
    );
    let deadline = env.ledger().timestamp() + DURATION;
    let id = campaigns.create(
        &organizer,
        &String::from_str(&env, "Gece Pizzasi"),
        &(100 * USDC),
        &deadline,
        &(10 * USDC),
        &(4 * USDC),
    );

    let reference = |n: u8| {
        let mut raw = [0u8; 32];
        raw[31] = n;
        BytesN::from_array(&env, &raw)
    };

    // 1. The organizer locks the bonus by bank transfer.
    let bonus_ticket = router.open_ticket(&organizer, &route, &arg(&env, KIND_BONUS, id));
    assert!(router.dispatch(&bonus_ticket, &(10 * USDC), &reference(1)));

    // 2. A participant pledges the same way.
    let ticket = router.open_ticket(&user, &route, &arg(&env, KIND_PLEDGE, id));
    assert!(router.dispatch(&ticket, &(2 * USDC), &reference(2)));
    assert_eq!(
        campaigns.get_pledge(&id, &user).unwrap().amount,
        2 * USDC
    );
    assert_eq!(token.balance(&campaign_id), 12 * USDC);

    // 3. The relayer retrying the same payment changes nothing.
    assert_eq!(
        router.try_dispatch(&ticket, &(2 * USDC), &reference(2)),
        Err(Ok(stello_router::Error::AlreadyPaid))
    );

    // 4. A late transfer is accepted on-chain but refunded by the campaign.
    env.ledger().set_timestamp(deadline + 1);
    assert!(!router.dispatch(&ticket, &(2 * USDC), &reference(3)));
    assert!(router.is_paid(&reference(3)));
    assert_eq!(token.balance(&user), 2 * USDC);

    // 5. The goal was missed, so everyone is refunded with a bonus share.
    assert_eq!(campaigns.pledger_at(&id, &0), Some(user.clone()));
    assert_eq!(campaigns.claim(&id, &user), 12 * USDC);
    assert_eq!(token.balance(&user), 14 * USDC);
    assert_eq!(token.balance(&campaign_id), 0);
}
