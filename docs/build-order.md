# OFSD Build Order

The sprint runs April 18-21, 2026 (weekend + Monday). Frontend (Sam) builds first, backend (Daniel) tests against the real UI.

## Sprint schedule

| Slot | Frontend | Backend |
|------|----------|---------|
| D1 AM | Landing page *(NEW)* + Fund/Class mgmt | DB migration + schema |
| D1 PM | Add Investor flow | Fund/Class API |
| D2 AM | Batch redesign + tracker | Auto-batch + close/export |
| D2 PM | Deploy popup + shares | Deploy endpoint (shares) |
| D3 AM | Valuation page | New valuation engine |
| D3 PM | Statements + dashboard | Statements + recon |
| D3 Eve | Integration, bug fixes, polish | — |

## Build-out sequence (what Claude Code should do)

### Phase 1 — Landing page *(Priority: FIRST)*
- `src/pages/landing/LandingPage.tsx`
- Route `/` (public, not wrapped in ProtectedRoute)
- Match `demos/landing-page.html` exactly
- Fund performance card pulls REAL data from `GET /api/v1/funds/summary`
- Tips carousel is static content (7 tips hardcoded in component)
- "Authenticate" button navigates to `/login` via React Router

### Phase 2 — Fund & Class Management
- `src/pages/funds/FundManagementPage.tsx`
- Route `/funds/manage`
- Existing `/funds` and `/funds/:id` routes stay as-is for now
- Uses `GET /api/v1/funds/summary` for the populated view with NAV data
- Uses `POST /api/v1/funds` and `POST /api/v1/funds/:id/classes` for modals
- Match `demos/fund-management.html`

### Phase 3 — Add Investor flow
- `src/pages/investors/AddInvestorPage.tsx`
- Route `/investors/add`
- Cascading Fund → Class → Currency dropdowns
- Debounced client code lookup (300ms) via `GET /api/v1/investors/:client_code`
- Two submit paths: new (`POST /investors`) vs existing (`POST /investors/existing`)
- Success state shows auto-assigned batch
- Match `demos/add-investor.html`

### Phase 4 — Batch redesign + tracker
- Refactor `src/pages/batches/BatchListPage.tsx` to show new fields (share_class, is_open, auto_close_at)
- Refactor `src/pages/batches/BatchDetailPage.tsx` — keep the existing stage stepper, add share_class context
- Batch filters: by share class, by open/closed
- Demo to be built later in the sprint

### Phase 5 — Deploy popup + shares allocation
- New modal `src/components/ui/DeploymentModal.tsx`
- Called from Batch Detail when advancing to stage 3
- Inputs: deployment date, NAV per share, transfer cost
- Calls `POST /batches/:id/deploy`, shows calculated shares per investor
- Demo to be built later

### Phase 6 — Valuation page (the core piece)
- New `src/pages/valuations/ValuationCreatePage.tsx` replaces existing
- Route `/valuations/new`
- Per-class NAV inputs grouped by currency
- Live reconciliation with PASS/FAIL
- Preview step calls `POST /valuation/preview`
- Confirm step calls `POST /valuation/nav`
- Demo to be built later

### Phase 7 — Statements + dashboard refresh
- `src/pages/investors/InvestorStatementPage.tsx` — NAV-based format
- `src/pages/dashboard/OverviewPage.tsx` — separate KES and USD charts
- Demos to be built later

## Build order reasoning

1. **Landing page first** because it's a public entry point with no backend dependencies (except the summary endpoint, which can render "not yet valued" states if the data isn't ready)
2. **Fund management next** because every other page depends on funds existing. This is foundational setup.
3. **Add Investor** builds on fund/class data. Creates investments.
4. **Batches** need investments to display and deploy.
5. **Deploy** creates investor_shares and initial NAV history.
6. **Valuation** reads investor_shares, writes valuation_snapshots.
7. **Statements & dashboard** are pure readers. They come last because all their data sources must be populated.

## Demo → React conversion checklist

For each page:
- [ ] Create the page component in the correct location
- [ ] Create/extend the service for API calls
- [ ] Add route to `src/routes/index.tsx` with lazy import
- [ ] Add route path to `src/lib/constants.ts` ROUTES
- [ ] Add types to `src/lib/types.ts` for new API shapes
- [ ] Use React state for interactive parts (modals, dropdowns, toggles)
- [ ] Replace demo state toggles with real navigation / data-driven states
- [ ] Replace demo's hardcoded data with service calls
- [ ] Handle loading state (use the existing `PageLoader` pattern)
- [ ] Handle empty state (from the demo's empty state)
- [ ] Handle error state (toast + fallback UI)
- [ ] Verify visual fidelity against the demo in the browser
- [ ] Test the page against Daniel's API once his endpoints are ready

## What NOT to do

- Don't create pages that aren't in the build order without asking
- Don't refactor existing pages unless the task requires it
- Don't add new npm dependencies without checking — stick to what's already installed
- Don't remove existing pages (Overview, Batch list, etc.) even while refactoring them
