# D2 Forge — Frontend

The Next.js 15 (App Router, TypeScript) frontend for D2 Forge, a Destiny 2
Armor 3.0 build optimizer. The Python MILP solver lives in `api/` and runs as
Vercel Functions.

For the project overview and the Destiny 2 armor system, see the
[root README](../README.md). For architecture, domain knowledge, and
conventions, see [CLAUDE.md](../CLAUDE.md).

## Development

All commands run from this `d2-forge/` directory:

```bash
npm run dev      # Start the dev server (Turbopack)
npm run build    # Production build
npm run start    # Serve the production build
npm run lint     # ESLint
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

## Deployment

Deployed on Vercel. See [VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md) for details.
