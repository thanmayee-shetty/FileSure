# FileSure CIN / LLPIN Checker

Paste up to 500 CINs and LLPINs (one per line) and see whether each is correctly formatted and what it encodes: listing status, state, year of incorporation and company type.

**This is a format check only.** Results are not verified against MCA records.

## Run

```bash
npm install
npm run dev        # local dev server
npm test           # Vitest + React Testing Library
npm run lint
npm run build      # type-check + production build to dist/
```

## Deploy (Vercel)

Import the repo in Vercel; `vercel.json` sets the Vite framework, `npm run build` and `dist/`. No environment variables are needed — all checks run in the browser.

## Structure

- `cin-reference-mappings.json` — versioned state and company-type reference data (single source of truth)
- `src/lib/` — pure, unit-tested validation: `cin.ts`, `llpin.ts`, `validate.ts` (type detection + unknown-format hints), `bulk.ts` (500-line limit, summary), `reference.ts`, `display.ts`, `csv.ts`
- `src/components/` — input panel, results summary/filters, desktop table, mobile cards
- Specs: `FileSure-Validation-Rules.md`, `CIN_LLPIN_Format_Reference.md`
