# LocalRadar Typography Design System

**Score target: 10/10 consistency.** One token set. Three fonts. No ad-hoc sizes.

## Fonts

| Token | Family | Use |
|-------|--------|-----|
| `--font-ui` / `font-sans` | **Geist** | UI, headings, buttons, nav |
| `--font-body` | **Inter** | Long-form paragraphs |
| `--font-data` / `font-mono` | **IBM Plex Mono** | Overlines, codes, tabular data labels |

Loaded via `next/font` in `src/app/layout.tsx` (no render-blocking Google CSS).

## Scale (canonical)

| Token | Size | Role class |
|-------|------|------------|
| 2xs | 11px | `.type-overline` `.type-badge` `.type-table-header` |
| xs | 12px | `.type-caption` `.type-label` |
| sm | 14px | `.type-body-sm` `.type-button` `.type-input` `.type-table-cell` `.type-mono` |
| md | 16px | `.type-body` |
| lg | 18px | `.type-body-lg` `.type-h4` |
| xl | 20px | `.type-body-xl` `.type-h3` |
| 2xl | 24px | `.type-h2` `.type-metric` |
| 3xl | 30px | `.type-h1` `.dash-title` |
| 4xl–7xl | 36–72px | `.type-display-*` `.hero-display` |

Tailwind utilities: `text-2xs` … `text-7xl` (defined in `@theme`).

## Role classes (prefer these)

```
.type-display-xl | lg | md | sm
.type-h1 … .type-h6
.type-body-xl | lg | body | body-sm
.type-caption | .type-overline | .type-label
.type-button | .type-input
.type-table-header | .type-table-cell
.type-metric | .type-badge | .type-mono
.hero-display | .section-title | .section-sub | .dash-title | .metric-value | .metric-label
```

## Weights (only four)

400 regular · 500 medium · 600 semibold · 700 bold  
(`font-extrabold` normalizes to bold)

## Rules

1. **Never** use `text-[Npx]` — map to the scale.
2. **Minimum** type size is **11px** (2xs) for WCAG.
3. Overlines / form labels / table headers: `.type-overline` or `text-2xs font-mono uppercase tracking-widest`.
4. Metrics & money: `.type-metric` or `tabular-nums`.
5. Paragraph measure: `max-w` ≈ 40rem (`.prose-marketing`).
6. Buttons: 14px / semibold / -0.01em tracking.

## Semantic colors

`--text-primary | secondary | muted | disabled | inverse | success | warning | danger | link`

Never pure `#000` / `#fff` for body copy.

## Files

- `src/app/layout.tsx` — font loading  
- `src/app/globals.css` — `@theme` tokens + inlined system + light overrides  
- `src/styles/typography.css` — source of truth (synced into globals)
