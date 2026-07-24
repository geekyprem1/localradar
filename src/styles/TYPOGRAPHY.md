# LocalRadar Typography System

## Font stack (only these three)

| Role | Family | Source |
|------|--------|--------|
| Primary UI | **Geist** | `geist/font/sans` (next/font local) |
| Secondary / body | **Inter** | `next/font/google` |
| Mono / data | **IBM Plex Mono** | `next/font/google` |

All loaded via `next/font` with `display: 'swap'` — no render-blocking Google stylesheet links.

## Scale classes

| Token | Class | Use |
|-------|-------|-----|
| Display XL/LG/MD/SM | `.text-display-xl` … `.text-display-sm` | Marketing heroes |
| Heading 1–6 | `.text-h1` … `.text-h6` | Page & card titles |
| Body XL → Small | `.text-body-xl` … `.text-body-sm` | Paragraphs |
| Caption / Overline | `.text-caption` / `.text-overline` | Meta, kicker |
| Button / Input / Label | `.text-button` / `.text-input` / `.text-label` | Controls |
| Table / Metric / Badge / Mono | `.text-table-*` / `.text-metric` / `.text-badge` / `.text-mono` | Data UI |

Helpers: `.hero-display`, `.section-title`, `.section-sub`, `.metric-value`, `.metric-label`, `.prose-marketing`.

## Semantic text colors

CSS vars: `--text-primary | secondary | muted | disabled | inverse | success | warning | danger | link`

Never pure `#000` / `#fff` for body copy.

## Numbers

Use `.tabular-nums` or `.text-metric` for scores, revenue, percentages, pricing.

## Files

- `src/app/layout.tsx` — font loading
- `src/styles/typography.css` — scale + roles
- `src/app/globals.css` — imports system + theme colors
