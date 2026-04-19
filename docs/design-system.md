# OFSD Design System

All visual decisions are already locked in. Use these tokens and patterns exactly. Do NOT introduce new colors, fonts, or component patterns without explicit approval.

## Fonts

Already loaded globally via `src/index.css`:

```css
@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
```

- **Body / UI:** Plus Jakarta Sans
- **Numbers, codes, data:** JetBrains Mono
- Use `var(--font-sans)` and `var(--font-mono)` in styles

## Colors — Core Palette

### Brand
| Token | Value | Use |
|-------|-------|-----|
| `--color-brand-400` | `#3B82F6` | Primary brand blue (buttons, links, focus) |
| `--brand-strong` | `#1A45FF` | Deep brand — primary CTA background |
| — | `#00005B` | Landing gradient endpoint |
| — | `#011FFC` | Emblem gradient |

### Backgrounds
| Token | Value | Use |
|-------|-------|-----|
| `--color-bg-base` | `#060B1A` | Page background (deep navy-black) |
| `--color-bg-surface` | `#10182D` | Card/surface background |
| `rgba(16,24,45,0.72)` + `backdrop-filter: blur(20px) saturate(150%)` | — | Glass card effect |

### Text
| Token | Value | Use |
|-------|-------|-----|
| `--color-text-primary` | `#FFFFFF` | Headings, primary content |
| `--color-text-secondary` | `#94A3B8` | Body, labels, sub-text |
| `--color-text-tertiary` | `#475569` | Hints, muted captions, disabled |

### Borders
| Token | Value | Use |
|-------|-------|-----|
| `--border-subtle` | `rgba(255,255,255,0.07)` | Default borders |
| `--border-default` | `rgba(255,255,255,0.1)` | Input borders |
| `--border-strong` | `rgba(59,130,246,0.35)` | Hover / focus borders |

### Semantic
| Token | Value | Use |
|-------|-------|-----|
| `--success` / `--success-bg` | `#10B981` / `rgba(16,185,129,0.12)` | Active, confirmed, gain |
| `--danger` / `--danger-bg` | `#EF4444` / `rgba(239,68,68,0.12)` | Loss, error, destructive |
| — (amber) | `#F59E0B` / `rgba(245,158,11,0.06)` | Warnings, rules, cautions |

### Currency colors (strict)
- **KES:** `#34D399` (badge text/accent), `rgba(16,185,129,0.1)` bg, `rgba(16,185,129,0.25)` border
- **USD:** `#60A5FA` (badge text/accent), `rgba(59,130,246,0.12)` bg, `rgba(59,130,246,0.3)` border

Never swap these. KES is always green-adjacent, USD is always blue-adjacent.

## Typography scale

| Element | Size | Weight | Notes |
|---------|------|--------|-------|
| Page title (h1) | 22px | 700 | `letter-spacing: -0.02em` |
| Section title | 10px | 600 | uppercase, `letter-spacing: 0.1em`, tertiary color |
| Card label | 10px | 600 | uppercase, `letter-spacing: 0.08em` |
| Body | 13px | 400 | secondary color, `line-height: 1.65` |
| Small body | 12px | 400 | |
| Field label | 11px | 500 | secondary color |
| Mono data | 11-13px | 500-600 | `letter-spacing: -0.01em` |
| Mono caption | 9-10px | 400-500 | tertiary color, `letter-spacing: 0.04em` |

## Layout tokens

- Border radius: `8px` (buttons, inputs), `12px` (cards inner), `14-16px` (cards outer), `20px` (icon containers), `100px` (pills)
- Card padding: `18px 22px` (compact), `22px 24px` (comfortable)
- Form field gap: `14px` vertical, `14px` horizontal in grids
- Section gap: `16-22px`
- Max content width: `1200px` for lists, `800px` for forms, `560px` for focused cards

## Patterns

### Glass card
```css
background: rgba(16,24,45,0.72);
-webkit-backdrop-filter: blur(20px) saturate(150%);
backdrop-filter: blur(20px) saturate(150%);
border: 1px solid rgba(255,255,255,0.07);
border-radius: 16px;
box-shadow: 0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.05);
```

### Page backdrop
```css
background:
  radial-gradient(circle at 85% 10%, rgba(59,130,246,0.07) 0%, transparent 45%),
  radial-gradient(circle at 10% 90%, rgba(59,130,246,0.05) 0%, transparent 50%),
  var(--color-bg-base);
```

Plus a fixed `.grid-bg` overlay with 40×40px grid at 0.025 opacity.

### Primary button
```css
background: #1A45FF;
color: white;
padding: 9px 16px;
border-radius: 8px;
font-weight: 500; font-size: 12px;
box-shadow: 0 0 16px rgba(26,69,255,0.3);
```
Hover: background `#2E57FF`, shadow stronger.

### Secondary button
Transparent background, `1px solid var(--border-default)`, text secondary. Hover: border becomes `rgba(59,130,246,0.45)`, text primary.

### Status pill
```css
display: inline-flex; align-items: center; gap: 5px;
padding: 3px 9px; border-radius: 100px;
font-size: 10px; font-weight: 600; letter-spacing: 0.02em;
```
With a 5px dot before text. Active = success, Inactive = subtle grey.

### Currency badge
```css
display: inline-flex; align-items: center; gap: 5px;
padding: 2px 8px; border-radius: 6px;
font-family: var(--mono);
font-size: 10px; font-weight: 600; letter-spacing: 0.04em;
```
Colors from the Currency colors table above.

### Top nav
Sticky, `background: rgba(6,11,26,0.85)` + blur. Logo left, nav items center-left, user chip right. Nav item active state: `background: rgba(59,130,246,0.12)`, primary text. See demos for exact markup.

### Form field
```
<label class="field-label">Name <span class="required">*</span></label>
<input class="field-input" placeholder="..."/>
<div class="field-hint">Helper text</div>
```

Input focus: `border-color: var(--color-brand-400)`, `box-shadow: 0 0 0 3px rgba(59,130,246,0.15)`.

### Modal
Overlay `rgba(0,0,0,0.65)` + blur. Modal itself uses glass card pattern with slightly stronger opacity (`0.95`) and accent border (`rgba(59,130,246,0.25)`). Max width `440px`. Entry animation: translateY(20px) + scale(0.96) → 0,1 over 0.25s.

## Micro-interactions

- Section step badge flips from blue numbered circle → green checkmark when section complete
- Chevron rotates 180° on expand
- Button hover: slight background brightness + stronger glow shadow
- Input focus: subtle 3px blue ring
- Modal open: fade + scale in (0.25s cubic-bezier)
- Fund card expand: `max-height` transition 0.35s ease

## What NOT to do

- No Tailwind classes in new code (the repo is migrating away)
- No generic AI-looking purple/pink gradients
- No emoji in production UI (use SVG icons from lucide-react)
- No border-radius on single-sided borders
- No floating particles, scan lines, or animated backgrounds on internal working pages (those are for the landing page only)
- No mid-sentence bold in running text
- Never hardcode colors like `color: #333` — always use CSS variables

## Reference implementation

The three HTML demos are the visual source of truth:
- `demos/landing-page.html` — the full atmospheric treatment (floating particles, emblem, etc.)
- `demos/fund-management.html` — internal page style with glass cards
- `demos/add-investor.html` — forms, cascading dropdowns, success states

When converting to React, match the demo pixel-for-pixel, then refactor.
