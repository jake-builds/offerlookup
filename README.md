# OfferLookup

OfferLookup is a small Next.js app for comparing job offers and compensation benchmarks before negotiation.

## Getting Started

This repo uses Volta to pin Node and npm. From the project directory, run:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Scripts

```bash
npm run dev    # start local development
npm run lint   # run ESLint
npm run build  # create a production build
```

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- ESLint
- Vercel Analytics

## Next steps

- Add real offer search and filtering.
- Add saved comparisons.
- Add data import/export.
- Review whether edit-offer reduces removals in analytics.

## Analytics

OfferLookup tracks privacy-safe usage events with Vercel Analytics. The event plan is documented in [docs/analytics-plan.md](docs/analytics-plan.md).
