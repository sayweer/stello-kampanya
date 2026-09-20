#![no_std]
//! "Ya Olur Ya Kazanırsın" — a dominant assurance contract funded by bank
//! transfer through the Stello router.
//!
//! An organizer locks a bonus up front and sets a goal and a deadline. People
//! pledge by sending a normal bank transfer. If the goal is met the organizer
//! takes the proceeds; if it is missed everyone gets their pledge back *plus* a
//! share of the bonus — which is what makes pledging early the rational move
//! instead of waiting to see what everyone else does.
//!
//! Money only ever arrives through `on_deposit`, called by the router in the
//! same transaction that moved the USDC here. Anything this contract refuses is
//! refunded on the spot, so funds never get stranded.

use soroban_sdk::{
    contract, contracterror, contractevent, contractimpl, contracttype, token::TokenClient,
    Address, Bytes, Env, String,
};

const DAY_IN_LEDGERS: u32 = 17_280;
const BUMP_THRESHOLD: u32 = 7 * DAY_IN_LEDGERS;
const BUMP_TO: u32 = 30 * DAY_IN_LEDGERS;
const MAX_TITLE_LEN: u32 = 64;

/// `arg` layout: `[kind u8][campaign id u64 big-endian]`.
const ARG_LEN: u32 = 9;
pub const KIND_PLEDGE: u8 = 1;
pub const KIND_BONUS: u8 = 2;

/// Why a deposit was refunded instead of recorded (see the `Rejected` event).
pub const REASON_BAD_ARG: u32 = 1;
pub const REASON_NO_CAMPAIGN: u32 = 2;
pub const REASON_NOT_LIVE: u32 = 3;
pub const REASON_CLOSED: u32 = 4;
pub const REASON_NOT_ORGANIZER: u32 = 5;
pub const REASON_BONUS_FULL: u32 = 6;

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Router,
    Usdc,
    Next,
    Campaign(u64),
    Pledge(u64, Address),
    /// Insertion-ordered index of everyone who pledged, so a refund run does
    /// not depend on events still being retained by an RPC provider.
    PledgerAt(u64, u32),
}

#[contracttype]
#[derive(Clone, Copy, Debug, Eq, PartialEq)]
#[repr(u32)]
pub enum Status {
    Open = 0,
    Succeeded = 1,
    Failed = 2,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Campaign {
    pub organizer: Address,
    pub title: String,
    pub goal: i128,
    pub deadline: u64,
    pub bonus: i128,
    pub bonus_funded: i128,
    /// Per-person weight ceiling for the bonus split; limits last-minute
    /// bonus hunting by a single large pledge.
    pub cap: i128,
    pub total: i128,
    pub weight_sum: i128,
    pub pledgers: u32,
    pub status: Status,
    pub proceeds_taken: bool,
    pub bonus_reclaimed: bool,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Pledge {
    pub amount: i128,
    pub claimed: bool,
}

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq)]
#[repr(u32)]
pub enum Error {
    NotFound = 1,
    BadState = 2,
    TooEarly = 3,
    AlreadyClaimed = 4,
    InvalidParam = 5,
}

#[contractevent]
pub struct Created {
    #[topic]
    pub campaign: u64,
    pub organizer: Address,
    pub goal: i128,
    pub deadline: u64,
    pub bonus: i128,
    pub cap: i128,
}

#[contractevent]
pub struct BonusFunded {
    #[topic]
    pub campaign: u64,
    pub amount: i128,
    pub bonus_funded: i128,
}

#[contractevent]
pub struct Pledged {
    #[topic]
    pub campaign: u64,
    #[topic]
    pub user: Address,
    pub amount: i128,
    pub total: i128,
}

#[contractevent]
pub struct Rejected {
    #[topic]
    pub campaign: u64,
    pub user: Address,
    pub amount: i128,
    pub reason: u32,
}

#[contractevent]
pub struct Settled {
    #[topic]
    pub campaign: u64,
    pub status: Status,
    pub total: i128,
}

#[contractevent]
pub struct Claimed {
    #[topic]
    pub campaign: u64,
    #[topic]
    pub user: Address,
    pub payout: i128,
    pub bonus_share: i128,
}

#[contractevent]
pub struct Withdrawn {
    #[topic]
    pub campaign: u64,
    pub amount: i128,
}

#[contractevent]
pub struct BonusReclaimed {
    #[topic]
    pub campaign: u64,
    pub amount: i128,
}

#[contract]
pub struct Campaigns;

#[contractimpl]
impl Campaigns {
    pub fn __constructor(env: Env, router: Address, usdc: Address) {
        let storage = env.storage().instance();
        storage.set(&DataKey::Router, &router);
        storage.set(&DataKey::Usdc, &usdc);
        storage.set(&DataKey::Next, &1u64);
    }

    pub fn create(
        env: Env,
        organizer: Address,
        title: String,
        goal: i128,
        deadline: u64,
        bonus: i128,
        cap: i128,
    ) -> Result<u64, Error> {
        organizer.require_auth();
        if goal <= 0
            || cap <= 0
            || bonus < 0
            || title.len() > MAX_TITLE_LEN
            || deadline <= env.ledger().timestamp()
        {
            return Err(Error::InvalidParam);
        }

        let id: u64 = env.storage().instance().get(&DataKey::Next).unwrap_or(1);
        env.storage().instance().set(&DataKey::Next, &(id + 1));

        let campaign = Campaign {
            organizer: organizer.clone(),
            title,
            goal,
            deadline,
            bonus,
            bonus_funded: 0,
            cap,
            total: 0,
            weight_sum: 0,
            pledgers: 0,
            status: Status::Open,
            proceeds_taken: false,
            bonus_reclaimed: false,
        };
        save(&env, id, &campaign);
        bump_instance(&env);

        Created {
            campaign: id,
            organizer,
            goal,
            deadline,
            bonus,
            cap,
        }
        .publish(&env);
        Ok(id)
    }

    /// Called by the router once a bank transfer has landed. Never fails on a
    /// business rule — an unusable deposit is refunded and reported as `false`,
    /// which keeps the payment settled instead of stuck in a retry loop.
    pub fn on_deposit(env: Env, user: Address, amount: i128, arg: Bytes) -> bool {
        let router: Address = env
            .storage()
            .instance()
            .get(&DataKey::Router)
            .expect("router not configured");
        router.require_auth();

        if amount <= 0 || arg.len() != ARG_LEN {
            return reject(&env, 0, &user, amount, REASON_BAD_ARG);
        }
        let kind = arg.get(0).unwrap();
        let id = campaign_id(&arg);

        let mut campaign: Campaign = match env.storage().persistent().get(&DataKey::Campaign(id)) {
            Some(campaign) => campaign,
            None => return reject(&env, id, &user, amount, REASON_NO_CAMPAIGN),
        };
        let closed = campaign.status != Status::Open
            || env.ledger().timestamp() >= campaign.deadline;

        match kind {
            KIND_BONUS => {
                if user != campaign.organizer {
                    return reject(&env, id, &user, amount, REASON_NOT_ORGANIZER);
                }
                if closed {
                    return reject(&env, id, &user, amount, REASON_CLOSED);
                }
                let room = campaign.bonus - campaign.bonus_funded;
                if room <= 0 {
                    return reject(&env, id, &user, amount, REASON_BONUS_FULL);
                }

                let accepted = if amount > room { room } else { amount };
                campaign.bonus_funded += accepted;
                save(&env, id, &campaign);
                if amount > accepted {
                    refund(&env, &user, amount - accepted);
                }

                BonusFunded {
                    campaign: id,
                    amount: accepted,
                    bonus_funded: campaign.bonus_funded,
                }
                .publish(&env);
                true
            }
            KIND_PLEDGE => {
                if closed {
                    return reject(&env, id, &user, amount, REASON_CLOSED);
                }
                // The promise is only credible once the bonus is actually locked.
                if campaign.bonus_funded < campaign.bonus {
                    return reject(&env, id, &user, amount, REASON_NOT_LIVE);
                }

                let key = DataKey::Pledge(id, user.clone());
                let mut pledge: Pledge = env
                    .storage()
                    .persistent()
                    .get(&key)
                    .unwrap_or(Pledge {
                        amount: 0,
                        claimed: false,
                    });

                if pledge.amount == 0 {
                    let slot = DataKey::PledgerAt(id, campaign.pledgers);
                    env.storage().persistent().set(&slot, &user);
                    env.storage()
                        .persistent()
                        .extend_ttl(&slot, BUMP_THRESHOLD, BUMP_TO);
                    campaign.pledgers += 1;
                }

                let old_weight = weight(pledge.amount, campaign.cap);
                pledge.amount += amount;
                campaign.weight_sum += weight(pledge.amount, campaign.cap) - old_weight;
                campaign.total += amount;

                env.storage().persistent().set(&key, &pledge);
                env.storage()
                    .persistent()
                    .extend_ttl(&key, BUMP_THRESHOLD, BUMP_TO);
                save(&env, id, &campaign);

                Pledged {
                    campaign: id,
                    user,
                    amount,
                    total: campaign.total,
                }
                .publish(&env);
                true
            }
            _ => reject(&env, id, &user, amount, REASON_BAD_ARG),
        }
    }

    /// Permissionless: anyone may close a campaign once its deadline has passed.
    /// Idempotent, so racing callers never see an error.
    pub fn settle(env: Env, campaign: u64) -> Result<Status, Error> {
        let mut data = load(&env, campaign)?;
        settle_inner(&env, campaign, &mut data)
    }

    /// Permissionless refund: the payout always goes to `user`, never to the
    /// caller, so the organizer (or the projection screen) can refund a whole
    /// room without anyone having to sign for themselves.
    pub fn claim(env: Env, campaign: u64, user: Address) -> Result<i128, Error> {
        let mut data = load(&env, campaign)?;
        if settle_inner(&env, campaign, &mut data)? != Status::Failed {
            return Err(Error::BadState);
        }

        let key = DataKey::Pledge(campaign, user.clone());
        let mut pledge: Pledge = env
            .storage()
            .persistent()
            .get(&key)
            .ok_or(Error::NotFound)?;
        if pledge.claimed {
            return Err(Error::AlreadyClaimed);
        }

        let bonus_share = bonus_share(&data, pledge.amount);
        let payout = pledge.amount + bonus_share;

        pledge.claimed = true;
        env.storage().persistent().set(&key, &pledge);
        env.storage()
            .persistent()
            .extend_ttl(&key, BUMP_THRESHOLD, BUMP_TO);
        pay(&env, &user, payout);

        Claimed {
            campaign,
            user,
            payout,
            bonus_share,
        }
        .publish(&env);
        Ok(payout)
    }

    pub fn withdraw_proceeds(env: Env, campaign: u64) -> Result<i128, Error> {
        let mut data = load(&env, campaign)?;
        data.organizer.require_auth();
        if settle_inner(&env, campaign, &mut data)? != Status::Succeeded {
            return Err(Error::BadState);
        }
        if data.proceeds_taken {
            return Err(Error::AlreadyClaimed);
        }

        // On success the organizer gets the pledges back *and* their own bonus.
        let amount = data.total + data.bonus_funded;
        data.proceeds_taken = true;
        save(&env, campaign, &data);
        pay(&env, &data.organizer, amount);

        Withdrawn { campaign, amount }.publish(&env);
        Ok(amount)
    }

    /// Nobody pledged at all: the locked bonus goes back to the organizer.
    pub fn reclaim_bonus(env: Env, campaign: u64) -> Result<i128, Error> {
        let mut data = load(&env, campaign)?;
        data.organizer.require_auth();
        if settle_inner(&env, campaign, &mut data)? != Status::Failed
            || data.total != 0
            || data.bonus_reclaimed
            || data.bonus_funded <= 0
        {
            return Err(Error::BadState);
        }

        let amount = data.bonus_funded;
        data.bonus_reclaimed = true;
        save(&env, campaign, &data);
        pay(&env, &data.organizer, amount);

        BonusReclaimed { campaign, amount }.publish(&env);
        Ok(amount)
    }

    pub fn get_campaign(env: Env, campaign: u64) -> Option<Campaign> {
        env.storage().persistent().get(&DataKey::Campaign(campaign))
    }

    pub fn get_pledge(env: Env, campaign: u64, user: Address) -> Option<Pledge> {
        env.storage()
            .persistent()
            .get(&DataKey::Pledge(campaign, user))
    }

    /// What `claim` would pay today. Also answers "what do I get if this
    /// campaign misses its goal?" while it is still open.
    pub fn quote_claim(env: Env, campaign: u64, user: Address) -> i128 {
        let Some(data) = Self::get_campaign(env.clone(), campaign) else {
            return 0;
        };
        match Self::get_pledge(env, campaign, user) {
            Some(pledge) if !pledge.claimed => pledge.amount + bonus_share(&data, pledge.amount),
            _ => 0,
        }
    }

    pub fn pledger_at(env: Env, campaign: u64, index: u32) -> Option<Address> {
        env.storage()
            .persistent()
            .get(&DataKey::PledgerAt(campaign, index))
    }

    /// Number of campaigns created so far; ids run from 1 to `count()`.
    pub fn count(env: Env) -> u64 {
        env.storage()
            .instance()
            .get(&DataKey::Next)
            .unwrap_or(1u64)
            - 1
    }
}

fn campaign_id(arg: &Bytes) -> u64 {
    let mut id: u64 = 0;
    for i in 1..ARG_LEN {
        id = (id << 8) | arg.get(i).unwrap_or(0) as u64;
    }
    id
}

fn weight(pledge: i128, cap: i128) -> i128 {
    if pledge > cap {
        cap
    } else {
        pledge
    }
}

fn bonus_share(campaign: &Campaign, pledge: i128) -> i128 {
    if campaign.weight_sum <= 0 || campaign.bonus_funded <= 0 {
        return 0;
    }
    // Integer division; the rounding dust stays in the contract.
    campaign.bonus_funded * weight(pledge, campaign.cap) / campaign.weight_sum
}

fn load(env: &Env, campaign: u64) -> Result<Campaign, Error> {
    env.storage()
        .persistent()
        .get(&DataKey::Campaign(campaign))
        .ok_or(Error::NotFound)
}

fn save(env: &Env, campaign: u64, data: &Campaign) {
    let key = DataKey::Campaign(campaign);
    env.storage().persistent().set(&key, data);
    env.storage()
        .persistent()
        .extend_ttl(&key, BUMP_THRESHOLD, BUMP_TO);
}

/// Closes the campaign if its deadline has passed. Returns the status either
/// way so callers can branch on it.
fn settle_inner(env: &Env, campaign: u64, data: &mut Campaign) -> Result<Status, Error> {
    if data.status != Status::Open {
        return Ok(data.status);
    }
    if env.ledger().timestamp() < data.deadline {
        return Err(Error::TooEarly);
    }

    data.status = if data.total >= data.goal {
        Status::Succeeded
    } else {
        Status::Failed
    };
    save(env, campaign, data);
    Settled {
        campaign,
        status: data.status,
        total: data.total,
    }
    .publish(env);
    Ok(data.status)
}

fn pay(env: &Env, to: &Address, amount: i128) {
    if amount <= 0 {
        return;
    }
    let usdc: Address = env
        .storage()
        .instance()
        .get(&DataKey::Usdc)
        .expect("usdc not configured");
    TokenClient::new(env, &usdc).transfer(&env.current_contract_address(), to, &amount);
}

/// Refunds a deposit this contract cannot use. If the transfer fails the whole
/// dispatch reverts, leaving the payment for the relayer to retry.
fn refund(env: &Env, user: &Address, amount: i128) {
    pay(env, user, amount);
}

fn reject(env: &Env, campaign: u64, user: &Address, amount: i128, reason: u32) -> bool {
    refund(env, user, amount);
    Rejected {
        campaign,
        user: user.clone(),
        amount,
        reason,
    }
    .publish(env);
    false
}

fn bump_instance(env: &Env) {
    env.storage().instance().extend_ttl(BUMP_THRESHOLD, BUMP_TO);
}

mod test;
