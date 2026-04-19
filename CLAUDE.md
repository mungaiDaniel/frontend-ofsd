# OFSD Frontend — Claude Code Instructions

You are helping Sam build the frontend for OFSD (Offshore Fund System & Distribution), an internal fund management system. The backend dev is Daniel, working in parallel. This is a weekend sprint.

## Read in this order before writing any code

1. `docs/context.md` — what OFSD does, who uses it, critical rules
2. `docs/design-system.md` — fonts, colors, components, layout tokens
3. `docs/api-contract.md` — exact endpoint shapes, request/response fields
4. `docs/data-model.md` — tables, relationships, where data lives
5. `docs/backend-additions.md` — backend changes beyond the dev doc (maintain this)
6. `docs/build-order.md` — sprint plan, what page comes next
7. `docs/current-task.md` — the specific page you're building right now

For each page you build, also read:
- The matching HTML demo in `demos/` — the design is already locked in
- Any relevant existing files in `src/` — reuse patterns, don't reinvent

## Hard rules

### Currency rule (non-negotiable)
Each share class has ONE currency — KES or USD, never both. A fund can hold classes in both currencies, but a single class is always one currency. This is enforced at the database level (`CHECK constraint on share_classes.currency`). The UI must enforce it too: the currency dropdown on "Add Class" must only offer KES and USD. Currency appears as a display-only badge on Add Investor (auto-derived from selected class).

### Data flow rule
Calculations happen ONCE, during valuation. Every other page READS from `valuation_snapshots` and `nav_history`. Fund Management, Investor Overview, Statements, Dashboard — none of them compute NAV or performance. They display pre-computed values.

### Design fidelity rule
The HTML demos in `demos/` are the source of truth for visual design. Match them exactly — same fonts, colors, spacing, glass effects, animations, copy. When converting a demo to React:
- Keep the structure and component hierarchy
- Extract inline styles into reusable components where it helps, inline otherwise
- Replace static data with `useState` / service calls
- Preserve every subtle detail: the metric-sub captions, the "NAV as of" stamp, currency-colored prefixes, etc.

### Integration rule
Every API call must use the exact field names and endpoint paths in `docs/api-contract.md`. Any deviation breaks integration with Daniel's backend. If you're unsure about a field name, check the doc first — don't guess.

## Tech stack — what's already decided

- **React 19** with **TypeScript** (strict mode)
- **Vite** as the build tool
- **react-router-dom v7** for routing
- **axios** for HTTP (pre-configured in `src/services/api.ts` with JWT interceptor)
- **motion/react** for animations (already a dep, use it)
- **lucide-react** for icons
- **Plus Jakarta Sans** (sans) + **JetBrains Mono** (mono) — loaded globally
- CSS: inline styles + CSS variables (NO Tailwind, NO CSS modules, NO styled-components)

## File structure — follow these conventions

```
src/
├── pages/
│   └── <feature>/<PageName>.tsx       # One page per file
├── services/
│   └── <feature>Service.ts            # Thin axios wrapper per domain
├── components/
│   ├── layout/                        # AppShell, Sidebar, Topbar
│   ├── data/                          # KPICard, StatusBadge, etc.
│   └── ui/                            # Modals, reusable UI primitives
├── lib/
│   ├── constants.ts                   # ROUTES, API paths, labels
│   ├── types.ts                       # Shared TS types
│   └── utils.ts                       # formatCurrency, formatDate, etc.
├── context/                           # React contexts (Auth, UI)
├── hooks/                             # Custom hooks
└── routes/
    └── index.tsx                      # Router config, lazy imports
```

## What to do on every new page

1. Create the page component in `src/pages/<feature>/<PageName>.tsx`
2. Create (or extend) the service in `src/services/<feature>Service.ts`
3. Add types to `src/lib/types.ts` if new shapes are needed
4. Register the route in `src/routes/index.tsx` with `lazy()` import + `withSuspense`
5. Add the route path to `src/lib/constants.ts` under `ROUTES`
6. Verify against the demo file visually (compare in browser)
7. Verify against `docs/api-contract.md` — do request/response shapes match?

## Important quirks

- The backend expects `Numeric(20,6)` precision for NAV and shares. Frontend displays them rounded (`.toFixed(4)` for NAV, `.toFixed(2)` for money) but ALWAYS sends raw decimal strings, never rounded values.
- KES classes use green (`#34D399` / `#10B981`). USD classes use blue (`#60A5FA` / `#3B82F6`). Never confuse these.
- NAV has an "as of" date that must be visible wherever NAV is shown. It's a point-in-time value — users have been burned by stale NAVs before.
- The auto-batch logic means users never manually pick a batch when adding an investor. The backend decides. The frontend just shows the assigned batch in the success state.

## Maintain docs/backend-additions.md

If you discover the frontend needs something from the backend that's NOT in `docs/api-contract.md` (because it wasn't in the original Development Guide), you must:

1. Add an entry to `docs/backend-additions.md` following the template at the bottom of that file
2. Assign a status: 🔴 Blocking, 🟡 Soft (fallback available), or ⚪ Deferred
3. Include: which page triggered the need, proposed endpoint contract, implementation notes for Daniel
4. Also add it to `docs/api-contract.md` marked as "*(new — to be confirmed with Daniel)*"
5. Mention it in your session summary so Sam can flag it to Daniel

Keep the doc current. When Daniel confirms or ships an endpoint, update its status to 🟢 Done.

## When you're unsure

Ask. Don't invent field names, don't guess endpoint shapes, don't freestyle the visual design. All three are fully specified in the docs + demos. If something genuinely isn't covered, flag it as a question before writing code.
