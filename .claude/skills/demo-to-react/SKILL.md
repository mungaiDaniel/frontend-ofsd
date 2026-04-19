---
name: demo-to-react
description: Use this skill when converting an HTML demo file from demos/ into a React component for the OFSD codebase. The demos are the visual source of truth and must be matched pixel-perfectly. This skill covers the mechanical conversion rules (inline styles, motion/react animations, state-driven sections) and the OFSD-specific conventions (CSS variables, currency handling, data flow).
---

# Converting OFSD Demos to React Components

## Principle

The HTML demo is the visual contract. Your React output must render identically. Deviations need explicit justification.

## Mechanical conversion rules

### 1. Inline styles stay inline
The demos use inline `style={{...}}` liberally. Keep them. DO NOT move them to CSS modules, styled-components, or Tailwind. The OFSD convention is inline styles + CSS variables. This is intentional — it keeps the component self-contained and matches the existing repo style.

Exception: if the same style object is repeated 4+ times within a component, extract it as a local constant:
```tsx
const CARD_STYLE = { background: "rgba(16,24,45,0.72)", /* ... */ } as const;
```

### 2. CSS variables are always used for semantic tokens
Replace hex values that appear in `design-system.md` with their CSS variable equivalents:
- Hardcoded `#FFFFFF` in text → `var(--color-text-primary)`
- Hardcoded `#94A3B8` → `var(--color-text-secondary)`
- Hardcoded `#3B82F6` → `var(--color-brand-400)`

Keep raw hex only for one-off accents not in the token system (e.g. the gain/loss greens and reds where semantic meaning is tied to the specific color).

### 3. Demo state toggles → React state
The demos have "State 1/2/3/4" buttons in the nav for demo purposes. Remove these entirely in React. The real app drives state via:
- URL params and React Router
- Form inputs with `useState`
- API responses via `useEffect`
- User actions (click, submit, etc.)

### 4. Demo `<script>` logic → React hooks
Convert the vanilla JS at the bottom of demos to React:
- `setInterval` → `useEffect` with `setInterval` + cleanup
- Direct DOM manipulation (`document.getElementById`) → `useState` + render
- Event listeners on class selectors → `onClick` props on elements

Example:
```tsx
// Demo: setInterval(() => { tipIdx = (tipIdx + 1) % TIPS.length; render(); }, 5000);

// React:
useEffect(() => {
  const id = setInterval(() => {
    setTipIdx(i => (i + 1) % TIPS.length);
  }, 5000);
  return () => clearInterval(id);
}, []);
```

### 5. Animations: use motion/react
The demos use CSS keyframes. In React, prefer `motion/react` for anything dynamic (sliders, fade-ins, modal entry). Static CSS animations (the pulsing status dot, hover transitions) can stay as CSS.

Decision rule:
- **CSS:** hover states, continuous loops (pulse, spin), transitions tied to class changes
- **motion/react:** entry/exit animations, list item stagger, anything coordinated with React state

### 6. SVG icons: use lucide-react when available
The demos embed SVG inline. In React, check if lucide-react has the icon first. If yes, import it. If no (or if the demo uses a very specific custom SVG), keep the inline SVG.

Common lucide icons used in OFSD:
- `Lock` (authenticate), `ChevronRight`, `ChevronDown`, `ChevronUp`
- `Plus`, `X`, `Check`, `AlertCircle`, `Info`
- `User`, `Users`, `Shield`
- `TrendingUp`, `TrendingDown`, `ArrowUpRight`
- `Calendar`, `Clock`
- `Landmark` (for fund icons)

Keep the inline SVG for the OFSD emblem specifically — no library has it.

### 7. Assets go in /public
Copy `logo.webp`, `emblem.webp` (and any other images referenced by the demo) to `public/` in the repo. Reference them as `/logo.webp` in the JSX.

### 8. Routing: use React Router hooks
Replace `<a href="/login">` (if any) with:
```tsx
import { useNavigate } from "react-router-dom";
const navigate = useNavigate();
<button onClick={() => navigate("/login")}>Authenticate</button>
```

For links that should feel like links (not buttons), use `<Link to="...">` from react-router-dom.

## OFSD-specific conventions

### Currency display
Always use the currency helpers (create in `src/lib/utils.ts` if not present):
```ts
formatCurrency(1072636.69, "KES") // → "KES 1,072,636.69"
formatCurrency(219074.79, "USD")  // → "$219,074.79"
formatNav(1389.5737)               // → "1,389.5737"
formatPercent(4.52)                // → "+4.52%"
```

Currency badges always follow the KES (green) / USD (blue) convention. Never mix.

### Data is never computed in components
If the demo shows "KES 1,072,636.69" as a market value, that value MUST come from `valuation_snapshots.market_value` via the API. Don't compute `shares * nav` in the component. Reference `docs/data-model.md` for where each number lives.

### Loading states
Use the existing pattern from `src/routes/index.tsx`:
```tsx
<div
  className="w-6 h-6 border-2 rounded-full animate-spin"
  style={{
    borderColor: "var(--color-border-subtle)",
    borderTopColor: "var(--color-brand-400)",
  }}
/>
```

### Error states
Log, toast, and fall back to an empty-state UI. Never crash the page. The demos' empty states are the reference — use them for error fallbacks too.

### Route registration
Every new page needs:
1. `lazy(() => import("@/pages/..."))` at the top of `src/routes/index.tsx`
2. A route object in the array, wrapped in `withSuspense(Component)`
3. A ROUTE constant in `src/lib/constants.ts` if it's referenced elsewhere

## The conversion workflow

1. Open the demo HTML in a browser side-by-side with your editor
2. Read the demo's `<style>` block — identify what CSS variables it already uses
3. Identify dynamic sections (state toggles, animations, data-driven content)
4. Start the React component with structure only — no styles, no data
5. Add inline styles section by section, matching the demo
6. Add state hooks for interactive pieces
7. Add service calls for data
8. Add motion/react for dynamic animations
9. Open both in the browser. Compare. Iterate until pixel-perfect.
10. Only then: refactor for code quality if needed (extract constants, split components)

## Common pitfalls

- **Forgetting `backdrop-filter`** — glass cards need both `-webkit-backdrop-filter` and `backdrop-filter` for Safari support
- **Breaking the `position: sticky` nav** — don't nest it inside a transformed or scrolled container
- **Missing the "as of" date stamp** — anywhere NAV is displayed, the valuation date must be visible
- **Wrong currency color** — KES is green, USD is blue, ALWAYS
- **Rounding at the wrong layer** — display rounding is fine, but send raw values to the backend
- **Demo's hardcoded data leaking into production** — the fund performance data in `demos/landing-page.html` is for demo only, real data comes from the API
