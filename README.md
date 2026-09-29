# Trucking Manager

Dispatch and fleet management app for a trucking company.

## Features

- **Weekly dispatch board** – drivers as rows, Mon–Sun as columns, routes (loads) in the day cells
- **Route form** – pickup/delivery ZIP with automatic city/state lookup, mileage, rate, division, status, comments and an audit trail
- **Drivers, dispatchers, trucks, trailers, divisions** – CRUD pages
- **Users and permissions** – per-section read/write permissions
- **Settings** – customizable route statuses and colors
- **PDF export** of routes

## Stack

Vite, React 18, TypeScript, react-router, Tailwind + shadcn/ui. Backend and auth are provided by the
hosted [Fine](https://fine.dev) platform through `@fine-dev/fine-js` (see `src/lib/fine.ts`).

## Development

```bash
npm install
npm run dev      # http://localhost:5173
npm run build
npm run lint
```

## Database

SQL migrations live in `fine/migrations`. To apply them to a local SQLite file (`fine.db`):

```bash
npm run db:init
```

Applied migrations are tracked in a `schema_migrations` table, so the command is safe to re-run.
`node fine/populate-zip-codes.js` pre-fills the `zipCodes` table from ZIPs already used in routes.

TypeScript types for the tables are in `src/lib/db-types.ts`; keep them in sync with the migrations.
