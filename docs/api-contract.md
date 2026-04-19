# OFSD API Contract

**Base URL:** `VITE_API_URL` env var, defaults to `http://localhost:4455/api/v1`

**Auth:** JWT in `Authorization: Bearer <token>` header. Interceptor in `src/services/api.ts` handles this automatically.

**Response envelope (all endpoints):**
```json
{ "status": 200|201|400|401|403|404|500, "data": <payload>, "message": "optional" }
```

Any deviation from these exact field names and shapes breaks integration with Daniel's backend.

---

## 1. Auth

### POST /api/v1/login
```json
Request:  { "email": "user@example.com", "password": "..." }
Response: { "status": 200, "data": {
  "access_token": "eyJ...",
  "refresh_token": "eyJ...",
  "user_role": "user|admin|super_admin",
  "user_name": "Sam"
}}
```

### POST /api/v1/users (register)
```json
Request: {
  "name": "Sam",
  "email": "sam@example.com",
  "password": "...",
  "user_role": "user"
}
```

---

## 2. Fund & Class Management

### GET /api/v1/funds
List all funds.
```json
Response: { "status": 200, "data": [
  { "id": 1, "fund_name": "Axiom", "fund_code": "AXM", "is_active": true }
]}
```

### POST /api/v1/funds
```json
Request:  { "fund_name": "Axiom", "fund_code": "AXM" }
Response: { "status": 201, "data": { "id": 1, "fund_name": "Axiom", "fund_code": "AXM", "is_active": true } }
```

### GET /api/v1/funds/:fund_id/classes
```json
Response: { "status": 200, "data": [
  { "id": 1, "core_fund_id": 1, "class_name": "Class I Participating Shares",
    "class_code": "KES_I", "currency": "KES", "is_active": true }
]}
```

### POST /api/v1/funds/:fund_id/classes
Each class has exactly ONE currency.
```json
Request: {
  "class_name": "Class I Participating Shares",
  "class_code": "KES_I",
  "currency": "KES"
}
Response: { "status": 201, "data": {
  "id": 1, "core_fund_id": 1, "class_name": "...",
  "class_code": "KES_I", "currency": "KES"
}}
```

### GET /api/v1/funds/summary  *(new — to be confirmed with Daniel)*
Returns funds with their latest NAV and performance joined from `nav_history` + `valuation_snapshots`. Used by the Fund Management page for the read-only NAV/performance columns.
```json
Response: { "status": 200, "data": {
  "as_of_date": "2026-04-10",
  "funds": [{
    "id": 1, "fund_name": "Axiom", "fund_code": "AXM", "is_active": true,
    "classes": [{
      "id": 1, "class_name": "Class I Participating Shares",
      "class_code": "KES_I", "currency": "KES", "is_active": true,
      "total_shares": 771.92,
      "prev_nav": 1329.4779, "current_nav": 1389.5737,
      "total_nav": 1072636.69,
      "performance_pct": 4.52,
      "valuation_date": "2026-04-10"
    }],
    "totals_by_currency": { "KES": 1072636.69, "USD": 220113.60 },
    "weighted_performance_pct": 4.77
  }]
}}
```

---

## 3. Investor Management

### POST /api/v1/investors
Add a new investor. System auto-assigns to open batch or creates new one.
```json
Request: {
  "investor_name": "Jane Doe",
  "investor_email": "jane@example.com",
  "investor_phone": "+254700000000",
  "internal_client_code": "INV-001",
  "fund_id": 1,
  "share_class_id": 1,
  "deposit_amount": 1000000.00,
  "deposit_date": "2026-04-15"
}
Response: { "status": 201, "data": {
  "investment_id": 42,
  "batch_id": 7,
  "batch_name": "AXM_KES_I_2026-04-23",
  "fund_name": "Axiom",
  "class_code": "KES_I",
  "currency": "KES",
  "deposit_amount": 1000000.00,
  "batch_close_at": "2026-04-23T09:00:00+03:00"
}}
```

### POST /api/v1/investors/existing
Add new deposit for an existing investor (identified by `internal_client_code`).
```json
Request: {
  "internal_client_code": "INV-001",
  "fund_id": 1,
  "share_class_id": 1,
  "deposit_amount": 500000.00,
  "deposit_date": "2026-04-16"
}
Response: same shape as POST /api/v1/investors
```

### GET /api/v1/investors/:client_code
Look up investor by client code. Used by Add Investor form for debounced auto-fill.
```json
Response (found): { "status": 200, "data": {
  "internal_client_code": "INV-001",
  "investor_name": "Jane Doe",
  "investor_email": "jane@example.com",
  "investor_phone": "+254700000000"
}}
Response (not found): { "status": 404, "message": "Investor not found" }
```

### GET /api/v1/investors
List all investors (for the directory page).

### GET /api/v1/investors/:client_code/overview
Returns the full investor position: current shares, market value, deposits, withdrawals.

### GET /api/v1/investors/:client_code/statement?period=2026-04
Returns the monthly valuation statement data.

---

## 4. Batches

### GET /api/v1/batches
List batches. Query params: `share_class_id`, `is_open`, `page`, `per_page`.

### GET /api/v1/batches/:id
Single batch detail, including all investments in the batch.

### PATCH /api/v1/batches/:id
Update batch fields. Used for stage advancement.
```json
Request: { "stage": 3, "deployment_date_actual": "2026-04-24", "deployment_nav": 1389.5737 }
```

### POST /api/v1/batches/:id/deploy
```json
Request: {
  "deployment_date": "2026-04-24",
  "nav_per_share": 1389.5737,
  "transfer_cost_total": 1500.00,
  "entry_fee_pct": 2.0
}
Response: { "status": 200, "data": {
  "batch_id": 7, "total_shares": 729.86, "investors": [...]
}}
```

### GET /api/v1/batches/:id/export
Returns the batch Excel file for sending to AXYS.

---

## 5. Valuation

### POST /api/v1/valuation/nav
Monthly valuation. Input current NAV per share and total fund NAV per class.
```json
Request: {
  "valuation_date": "2026-04-10",
  "classes": [
    { "share_class_id": 1, "nav_per_share": 1389.5737, "total_fund_nav": 1072636.69 },
    { "share_class_id": 2, "nav_per_share": 15.1905,   "total_fund_nav": 219074.79 },
    { "share_class_id": 3, "nav_per_share": 12.9358,   "total_fund_nav": 1038.81 }
  ]
}
Response: { "status": 200, "data": {
  "valuation_date": "2026-04-10",
  "classes": [{
    "class_code": "KES_I", "nav_per_share": 1389.5737,
    "system_total_nav": 1072636.96, "head_office_nav": 1072636.69,
    "difference": 0.27, "status": "PASS",
    "investors": [{
      "client_code": "INV-001", "shares": 729.86,
      "market_value": 1014178.42, "performance_pct": 4.52
    }]
  }]
}}
```

Backend process per class:
1. Load all active `investor_shares` for this class
2. Calculate `system_total_nav = sum(shares_owned) * nav_per_share`
3. Compare to `total_fund_nav` from AXYS
4. If `diff > 1.00`: return error, do not proceed
5. If pass: compute `market_value` and `performance_pct` per investor
6. Save `valuation_snapshot` for each investor
7. Save `nav_history` record for class + date

### POST /api/v1/valuation/preview
Same request shape as `/api/v1/valuation/nav` but does NOT commit. Used for the preview step before confirmation.

---

## 6. Reports & Statements

### GET /api/v1/reports/portfolio
Portfolio dashboard data — separate KES and USD totals, performance trend.

### GET /api/v1/investors/:client_code/statement/:period/pdf
Generates the PDF monthly statement for an investor.

### GET /api/v1/investors/:client_code/deposit-statement/:investment_id/pdf
Generates the PDF deposit statement (after deployment).

---

## 7. Withdrawals

### GET /api/v1/withdrawals
List withdrawal requests.

### POST /api/v1/withdrawals
```json
Request: {
  "internal_client_code": "INV-001",
  "share_class_id": 1,
  "shares_to_redeem": 100.0,
  "withdrawal_date": "2026-04-20"
}
```

### POST /api/v1/withdrawals/upload
Bulk upload via Excel.

---

## 8. Audit

### GET /api/v1/audit-logs *(super admin only)*
```json
Query: ?action=deploy&target_type=batch&page=1&per_page=50
Response: { "status": 200, "data": [
  { "id": 1, "timestamp": "2026-04-18T10:30:00+03:00",
    "user_id": 3, "user_name": "Sam", "user_email": "sam@...",
    "action": "batch.deploy", "target_type": "batch", "target_id": 7,
    "details": {...} }
]}
```

---

## 9. Users

### GET /api/v1/users
### PATCH /api/v1/super_admin/users/:id/approve  *(super admin)*
### PATCH /api/v1/super_admin/users/:id/role  *(super admin)*

---

## Error handling

The axios interceptor in `src/services/api.ts` handles:
- `401` → clear tokens, redirect to `/login`
- `403` with "pending administrator approval" → same as above

All other errors propagate to the caller as rejected promises. Services should either surface them via toast or return typed error objects.
