# My Basecamp

A Vite-powered React starter with TypeScript, Tailwind CSS, TanStack Router, and TanStack Query.

## Getting started

```bash
npm install
npm run dev
```

## Scripts

- `npm run dev` — start the development server
- `npm run build` — create and type-check a production build
- `npm run lint` — run Oxlint
- `npm run preview` — preview the production build

Routes live in `src/routes`. TanStack Router generates `src/routeTree.gen.ts` when Vite starts.

## Brand colors

`src/styles/brand-colors.css` is the source of truth for UI colors. Its `:root`
values preserve the current Ogilvy appearance; legacy workshop theme fields are
not used. Only colors are themed—fonts, spacing and component geometry are unchanged.

To add a brand, append a selector after the defaults and override the relevant
roles, then set `data-brand` on `<html>` (currently `ogilvy` in `index.html`):

```css
:root[data-brand="example"] {
  --action-primary-bg: #0057b8;
  --action-primary-text: #ffffff;
  --entry-action-bg: #0057b8;
  --entry-action-hover-bg: #004494;
  --entry-action-text: #ffffff;
  --focus-ring: #0057b8;
}
```

Unspecified roles fall back to Ogilvy. For a complete theme, review all roles in
the file, including light/dark surfaces, text, borders, errors, ticker, overlays
and ambient effects. Roles with identical defaults are independent on purpose:
changing a button color must not implicitly change an error color.

Components use semantic Tailwind utilities such as `bg-action`, `text-content`
and `border-line/20`, backed by `@theme inline` aliases. CSS gradients and inline
styles use the same variables directly. Keep opacity modifiers at the usage
site; do not add fonts, sizes or layout values to the color theme.

The ambient WebGL renderer reads its color variables from computed styles and
refreshes when the document's `data-brand`, `class` or inline `style` changes.
Use CSS color values supported by Three.js (hex or RGB) for the `--ambient-*`
roles consumed by WebGL. The CSS fallback uses the same palette.

Team/coach identity colors, their fallback palettes and their contrast helpers
are intentionally excluded. Do not replace these with brand variables even
when their hex values happen to match the theme.
