# OFSD Context — What This System Does

## The business

OFSD (Offshore Fund System & Distribution) is an internal operations system for AI BAXYS Africa. It manages offshore fund investments on behalf of Kenyan clients, with the actual fund managed by AXYS in Mauritius.

## The core workflow

1. **Client deposits money** (KES or USD) with AI BAXYS in Kenya
2. **Ops team records the client** in OFSD via "Add Investor" — entering name, fund, share class, deposit amount
3. **OFSD auto-assigns** the investor to an open weekly batch (batch closes every Thursday 09:00 EAT)
4. **Batch closes and is exported** as an Excel file sent to AXYS Head Office in Mauritius
5. **AXYS deploys the funds** — purchases shares at the NAV per share on deployment date
6. **Ops records the deployment** in OFSD — NAV per share and deployment date
7. **Shares are allocated** to each investor in the batch (`shares = net_amount / deployment_nav`)
8. **Monthly valuation** — ops enters the current NAV per share (from AXYS) for each class, system reconciles total NAV, saves snapshots
9. **Statements are generated** per investor per month, showing shares held, current NAV, market value, performance
10. **Withdrawals** — client requests withdrawal, shares are redeemed at current NAV, net amount returned

## The users

- **Ops team** (default user role `user`) — day-to-day: adding investors, managing batches, recording deployments, running valuations, generating statements
- **Admins** (`admin`) — all of the above plus user approval
- **Super admins** (`super_admin`) — full access including audit log

Every user sees everything (within their role). OFSD is not multi-tenant. There's no "client portal" — clients never log in.

## What's changing (the April 2026 sprint)

The old system used percentage-based compounding — wrong. AXYS operates on a share-based (NAV per share) model. We're replacing the valuation engine entirely. Every investor position becomes `shares × current NAV`. Performance is derived from NAV movement, not input manually.

## The single most important rule

**Each share class holds exactly ONE currency.** KES classes are KES only. USD classes are USD only. A fund can offer classes in both currencies, but a single class never mixes. This is enforced in the database (CHECK constraint), in the API, and must be enforced in the UI.

## Terminology cheat sheet

| Term | Meaning |
|------|---------|
| NAV | Net Asset Value — total value of a fund/class |
| NAV per Share | Price of one share. `market_value = shares × NAV per share` |
| Share Class | Subdivision of a fund with its own NAV + currency (e.g. KES_I, USD_I, USD_R) |
| Deployment | When AXYS actually invests client money (purchases shares) |
| Deployment NAV | NAV per share on the deployment date — used to calculate initial shares |
| Reconciliation | Checking system totals match AXYS figures (<1.00 currency tolerance) |
| Batch | Weekly grouping (Fri-Thu) of investors sent to AXYS together |
| Contract Note | AXYS confirmation doc after deployment |
| Entry Fee | 2% fee on deposit before shares purchased |
| Exit Fee | 2% fee on early withdrawal (<6 months) |
| Transfer Cost | Bank fees for moving money to Mauritius |
| AXYS | The Mauritius-based offshore fund manager |
| AUM | Assets Under Management |
| EAT | East Africa Time (UTC+3) |

## Real reference data (from AXYS NAV statement, 10 April 2026)

Use these exact numbers when you need realistic values for UI:

| Class | Code | Currency | Shares | Prev NAV | Current NAV | Performance | Market Value |
|-------|------|----------|--------|----------|-------------|-------------|--------------|
| Class I Participating | KES_I | KES | 771.92 | 1,329.4779 | 1,389.5737 | +4.52% | 1,072,636.69 |
| Class I Participating | USD_I | USD | 14,421.80 | 14.4809 | 15.1905 | +4.90% | 219,074.79 |
| Class R Restricted | USD_R | USD | 80.30 | 12.3327 | 12.9358 | +4.89% | 1,038.81 |

**Total KES:** 1,072,636.69
**Total USD:** 220,113.60

Formulas:
- Market Value = shares × current_nav
- Performance = (current_nav − prev_nav) / prev_nav × 100

## Sample fund set (for demos and seeds)

| Fund Name | Fund Code | Classes |
|-----------|-----------|---------|
| Axiom | AXM | KES_I, USD_I, USD_R |
| Atium | ATM | KES_I, USD_I |
| Nova Reserve | NVR | *(pending setup)* |
