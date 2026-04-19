# OFSD Data Model

Everything the frontend displays traces back to these tables. Understanding where data lives prevents the frontend from asking Daniel to compute things that are already computed, or from displaying stale values.

## Entity relationships

```
CoreFund (1) ────> (many) ShareClass
ShareClass (1) ──> (many) Batch               [each batch belongs to exactly one class]
ShareClass (1) ──> (many) NavHistory          [NAV tracked per class per date]
Batch (1) ───────> (many) Investment          [investors in the batch]
Investment (1) ──> (many) InvestorShares      [shares per class per batch]
InvestorShares (1) -> (many) ValuationSnapshot [monthly valuations]
```

## Tables

### core_funds *(existing, minor updates)*
| Column | Type | Notes |
|--------|------|-------|
| id | PK | |
| fund_name | String(100) | e.g. "Axiom" |
| fund_code | String(20) | e.g. "AXM" |
| is_active | Boolean | default true |
| created_at | DateTime(tz) | |

### share_classes *(NEW)*
| Column | Type | Notes |
|--------|------|-------|
| id | PK | |
| core_fund_id | FK core_funds.id | NOT NULL |
| class_name | String(100) | e.g. "Class I Participating Shares" |
| class_code | String(20) | UNIQUE, e.g. "KES_I" |
| currency | String(3) | **CHECK IN ('KES','USD')** — single currency per class |
| is_active | Boolean | default true |
| created_at | DateTime(tz) | |

Unique constraint on `(core_fund_id, class_code)`.

### nav_history *(NEW)*
The source of truth for NAV pricing.
| Column | Type | Notes |
|--------|------|-------|
| id | PK | |
| share_class_id | FK share_classes.id | NOT NULL |
| nav_date | Date | NOT NULL |
| nav_per_share | Numeric(20,6) | NOT NULL |
| total_fund_nav | Numeric(20,2) | NULLABLE (AXYS total for recon) |
| source | String(20) | 'deployment' or 'valuation' |
| created_at | DateTime(tz) | |

Unique constraint on `(share_class_id, nav_date, source)`.

### investor_shares *(NEW)*
How many shares a particular investor owns in a particular class.
| Column | Type | Notes |
|--------|------|-------|
| id | PK | |
| investment_id | FK investments.id | NOT NULL |
| share_class_id | FK share_classes.id | NOT NULL |
| batch_id | FK batches.id | NOT NULL |
| shares_owned | Numeric(20,6) | NOT NULL |
| deployment_nav | Numeric(20,6) | NOT NULL |
| deployment_date | Date | NOT NULL |
| is_active | Boolean | default true |
| created_at | DateTime(tz) | |

### valuation_snapshots *(NEW)*
Audit trail and source for statement generation. **Every display of market value / performance reads from here.**
| Column | Type | Notes |
|--------|------|-------|
| id | PK | |
| investor_shares_id | FK investor_shares.id | NOT NULL |
| valuation_date | Date | NOT NULL |
| nav_per_share | Numeric(20,6) | NOT NULL |
| shares_held | Numeric(20,6) | NOT NULL |
| market_value | Numeric(20,2) | NOT NULL |
| performance_pct | Numeric(10,4) | NOT NULL |
| created_at | DateTime(tz) | NOT NULL, default utcnow |

Unique constraint on `(investor_shares_id, valuation_date)`.

### batches *(existing, new columns added)*
| Column | Type | Notes |
|--------|------|-------|
| id | PK | *(existing)* |
| batch_name | String | e.g. "AXM_KES_I_2026-04-23" *(existing)* |
| certificate_number | String | *(existing)* |
| date_deployed | Date | *(existing)* |
| duration_days | Integer | *(existing)* |
| is_active | Boolean | *(existing)* |
| stage | Integer | 1=Deposited, 2=Transferred, 3=Deployed, 4=Active |
| is_transferred | Boolean | *(existing)* |
| **share_class_id** | FK share_classes.id | NULLABLE (null for legacy) |
| **is_open** | Boolean | default true — True while accepting investors |
| **auto_close_at** | DateTime(tz) | next Thursday 09:00 EAT |
| **exported_at** | DateTime(tz) | when Excel was exported |
| **total_shares** | Numeric(20,6) | populated at deployment |
| **deployment_nav** | Numeric(20,6) | NAV at deployment |
| **deployment_date_actual** | Date | from AXYS confirmation |

### investments *(existing, new columns added)*
| Column | Type | Notes |
|--------|------|-------|
| id | PK | *(existing)* |
| investor_name | String | *(existing)* |
| investor_email | String | *(existing)* |
| investor_phone | String | *(existing)* |
| internal_client_code | String | *(existing, unique per investor)* |
| amount_deposited | Numeric | *(existing)* |
| batch_id | FK | *(existing)* |
| fund_id | FK core_funds.id | *(existing)* |
| fund_name | String | *(existing, denormalized)* |
| date_deposited | DateTime | system timestamp *(existing)* |
| date_transferred | Date | *(existing)* |
| contract_note | String | *(existing)* |
| transaction_fee_usd | Numeric | *(existing)* |
| entry_fee_usd | Numeric | *(existing)* |
| main_balance | Numeric | *(existing)* |
| **share_class_id** | FK share_classes.id | NULLABLE (null for legacy) |
| **deposit_date** | Date | actual client deposit date (new field) |

### users *(existing)*
Standard: id, name, email, password hash, user_role, status, created_at.

### audit_logs *(existing)*
Records every state-changing action with user_id, action, target_type, target_id, details JSON, timestamp.

## Data flow diagram

```
┌─────────────────┐
│ Add Investor    │  POST /investors        
│ (/investors/add)│  writes to investments, auto-assigns batch_id
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Batch Detail    │  reads investments
│ (/batches/:id)  │  PATCH /batches/:id → updates stage
└────────┬────────┘
         │ Advance to stage 3 (Deployed)
         ▼
┌─────────────────┐
│ Deploy Popup    │  POST /batches/:id/deploy
│ (modal)         │  writes investor_shares + nav_history (source='deployment')
└────────┬────────┘
         │ 
         ▼
┌─────────────────┐
│ Valuation Page  │  POST /valuation/nav
│(/valuations/new)│  writes valuation_snapshots + nav_history (source='valuation')
└────────┬────────┘
         │ (no more writes — everything downstream READS)
         ▼
┌────────────────────────────────────────────┐
│ READ-ONLY consumers:                        │
│  - Fund Management (summary totals)         │
│  - Investor Overview (position, history)    │
│  - Monthly Statements (snapshot at date)    │
│  - Dashboard (portfolio aggregations)       │
│  - Audit Log (all state changes)            │
└────────────────────────────────────────────┘
```

## Precision rules

- `nav_per_share`: 4-6 decimal places displayed, stored as `Numeric(20,6)`
- `shares_owned`: up to 6 decimal places
- `market_value`: stored `Numeric(20,2)`, always rounded to 2 decimals for display
- `performance_pct`: stored `Numeric(10,4)`, displayed as `+X.XX%` (2 decimal places)
- Reconciliation tolerance: `<1.00` currency units. Differences above this FAIL the valuation.

**Never compute these in the frontend.** Always receive them from the backend, pre-computed.

## Formatting conventions

Use helpers in `src/lib/utils.ts`:
- `formatCurrency(amount, currency)` → `"KES 1,072,636.69"` or `"$219,074.79"`
- `formatNav(nav)` → `"1,389.5737"` (4 decimals for KES, often 4 for USD too)
- `formatShares(shares)` → up to 2-6 decimals depending on context
- `formatDate(date)` → `"10 Apr 2026"`
- `formatPercent(pct)` → `"+4.52%"` or `"-1.20%"`

If these helpers don't exist yet, create them — don't inline formatting logic in components.
