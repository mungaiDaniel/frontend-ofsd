# Current Task — Batch Redesign

**Build:** `src/pages/batches/BatchListPage.tsx` (add share_class, is_open, auto_close_at fields)
**Build:** `src/pages/batches/BatchDetailPage.tsx` (add share_class context, new deploy modal)
**Route:** `/batches`, `/batches/:id`
**Visual reference:** Design system docs — match glass card style from FundManagementPage

> Add Investor page is complete at `/investors/add`. Valuation page rewritten for NAV-based system. Credits page + Konami hook complete.

---

<!-- Previous task retained for reference -->
# Completed — Add Investor Flow

**Build:** `src/pages/investors/AddInvestorPage.tsx`
**Route:** `/investors/add`
**Visual reference:** `demos/add-investor.html` — matched

---

<!-- Previous task retained for reference -->
# Completed — Valuation Page (NAV-based system)

**Build:** `src/pages/valuations/ValuationCreatePage.tsx` (full rewrite)
**Route:** `/valuations/new`
**Service additions:** `valuationService.preview()`, `valuationService.submitNav()`
**Type additions:** `ValuationRequest`, `ValuationResponse`, `ValuationClassInput`, etc.

---

<!-- Previous task retained for reference -->
# Completed — Fund & Class Management

**Build:** `src/pages/funds/FundManagementPage.tsx`
**Route:** `/funds/manage`
**Visual reference:** `demos/fund-management.html` — matched exactly

---

<!-- Previous task retained for reference -->
# Completed — Landing Page

**Build:** `src/pages/landing/LandingPage.tsx`
**Route:** `/` (public, not protected)
**Visual reference:** `demos/landing-page.html` — matched exactly

---

<!-- Previous task retained for reference -->
# Completed — Fund & Class Management

**Build:** `src/pages/funds/FundManagementPage.tsx`
**Route:** `/funds/manage`
**Visual reference:** `demos/fund-management.html` — match it exactly

---

<!-- Previous task retained for reference -->
# Completed — Landing Page

**Build:** `src/pages/landing/LandingPage.tsx`
**Route:** `/` (public, not protected)
**Visual reference:** `demos/landing-page.html` — match it exactly
**API dependency:** `GET /api/v1/funds/summary` (for the Fund Performance card)

## What this page is

A pre-login splash page at `/` that leads to `/login`. Internal but polished — the front door to a serious financial tool. The visual language here is bolder than the rest of the app: floating particles, animated emblem, glass cards, atmospheric gradients. This treatment lives here and on nowhere else.

## Layout

Single full-height screen, two columns:
- **Left column:** Logo → status pill → "Offshore Fund Management" wordmark → tagline → Authenticate + Request Access buttons → stat strip (KES & USD, v2.0)
- **Right column:** Fund Performance card (top) + Quick Tips card (bottom)

## Behavior

### Fund Performance card (THE IMPORTANT ONE)

Shows real per-class performance data from `GET /api/v1/funds/summary`. Cycles through the classes every 3 seconds with a right-to-left slide animation.

For each class, display:
- Class code (e.g. "Axiom / KES_I" or period label "Q1 '26")
- NAV per share (current, from `current_nav`)
- Performance percentage with gain/loss color and arrow
- Sparkline showing recent NAV trend

**Data source:**
```
GET /api/v1/funds/summary

Response.data.funds[].classes[] → each class has:
  class_code, currency, current_nav, prev_nav, performance_pct, valuation_date
```

If the endpoint returns empty or errors, fall back to static placeholder content ("No valuation data yet — awaiting first valuation"). Don't crash.

If the endpoint fails entirely (404, 500), log once and show the placeholder. Don't retry aggressively.

### Quick Tips card

Static array of 7 tips (the same ones from the demo). Auto-advance every 5 seconds with a progress bar. Click dots to jump. Tips are hardcoded in the component — not from the API.

Tips content (exact, do not change):
```
1. "Batches progress through four stages: Deposited → Transferred → Deployed → Active. Use the Batch detail page to advance stage and log deployment dates."
2. "Each share class carries a single currency — KES or USD are always kept separate. Never mix currencies within the same share class."
3. "Before committing a valuation, verify the NAV per share is correct. Committed valuations trigger pro-rata share allocation across all investors in the batch."
4. "Use Investor Overview to see a client's full position: share balance, KES/USD deployment history, and pending withdrawals in one view."
5. "Monthly statements are generated per investor from Reports. Ensure the valuation for the relevant period is committed before generating."
6. "The Audit Log (super admin only) records every state-changing action with timestamp, actor, and affected record."
7. "When uploading a withdrawal file, the system reconciles against existing investments automatically. Review the preview before confirming."
```

### Authenticate button
`onClick={() => navigate('/login')}` — React Router navigation, no href.

### Request Access button
`onClick={() => navigate('/register')}` — React Router navigation.

### System Status
Top-right. "System Status" label above "All Systems Operational" value, both white. Pulsing green dot alongside. Static for now (no health check API yet).

## What NOT to do

- Do NOT include floating particles, scan lines, or the spinning emblem animation (those were explicitly removed in the final demo version)
- Do NOT show "Fund Performance" / "Compliance / Support / Terms" footer links (also removed)
- Do NOT use a gradient on the Authenticate button — it's solid `#1A45FF`
- Do NOT include dummy "Q1 '23" quarterly data if real data is available; that was for demo only

## Technical notes

### Use motion/react for the slide animation
```tsx
import { motion, AnimatePresence } from "motion/react";

<AnimatePresence initial={false} mode="wait">
  <motion.div
    key={currentClassIndex}
    initial={{ opacity: 0, x: 60 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: -60 }}
    transition={{ duration: 0.5, ease: "easeInOut" }}
  >
    {/* class performance content */}
  </motion.div>
</AnimatePresence>
```

### Service setup
Create `src/services/fundSummaryService.ts`:

```ts
import api from "./api";
import type { FundSummaryResponse } from "@/lib/types";

export const fundSummaryService = {
  async getSummary(): Promise<FundSummaryResponse | null> {
    try {
      const res = await api.get<{ status: number; data: FundSummaryResponse }>("/funds/summary");
      return res.data.data;
    } catch (err) {
      console.warn("Fund summary unavailable", err);
      return null;
    }
  },
};
```

### Types to add to `src/lib/types.ts`
```ts
export interface FundSummaryClass {
  id: number;
  class_name: string;
  class_code: string;
  currency: "KES" | "USD";
  is_active: boolean;
  total_shares: number;
  prev_nav: number;
  current_nav: number;
  total_nav: number;
  performance_pct: number;
  valuation_date: string;  // ISO date
}

export interface FundSummaryFund {
  id: number;
  fund_name: string;
  fund_code: string;
  is_active: boolean;
  classes: FundSummaryClass[];
  totals_by_currency: { KES?: number; USD?: number };
  weighted_performance_pct: number;
}

export interface FundSummaryResponse {
  as_of_date: string;
  funds: FundSummaryFund[];
}
```

### Route registration

In `src/routes/index.tsx`:

```tsx
const LandingPage = lazy(() => import("@/pages/landing/LandingPage"));

// In the routes array, BEFORE the `/` redirect:
{ path: "/", element: withSuspense(LandingPage) },

// Remove or replace the existing: { path: "/", element: <Navigate to="/overview" replace /> }
```

This makes `/` public. Authenticated users hitting `/` still see the landing page — that's fine, they click Authenticate to continue. (Alternative: check auth state on mount and redirect to `/overview` if already authenticated. Optional, not required.)

### Constants

Add to `src/lib/constants.ts` under ROUTES:
```ts
LANDING: "/",
```

## Deliverable checklist

- [ ] Page renders identically to `demos/landing-page.html` (same fonts, colors, spacing, glass cards)
- [ ] Logo loads from `/public/logo.webp` (copy from bundle if not present)
- [ ] Emblem loads from `/public/emblem.webp` (copy from bundle if not present)
- [ ] Fund Performance card fetches from `GET /api/v1/funds/summary` on mount
- [ ] Classes cycle every 3s with right-to-left slide
- [ ] Falls back gracefully if API returns empty or errors
- [ ] Tips carousel advances every 5s with progress bar
- [ ] Tip dots are clickable and jump to the selected tip
- [ ] Authenticate button navigates to `/login`
- [ ] Request Access button navigates to `/register`
- [ ] Page is registered at `/` and is publicly accessible
- [ ] Responsive — on narrow screens (<768px), right column hides, hero stacks

## When done

Report back:
- What files were created
- What files were modified (with reasoning)
- Any deviation from the demo and why
- Any API shape ambiguity that needs clarification with Daniel

Then update `docs/current-task.md` to point to the next task (Fund & Class Management — see `build-order.md`).
