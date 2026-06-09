# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Structure

This is D2 Forge, a Destiny 2 armor build optimizer deployed on Vercel. The project has a hybrid architecture:

- **Frontend**: Next.js 15 with TypeScript (`d2-forge/` directory)
- **Backend**: Python Vercel Functions for optimization (`d2-forge/api/` directory)
- **Working Directory**: Always work from `/Users/brandonyee/repos/D2Forge/d2-forge/` for all operations

## Development Commands

All commands should be run from the `d2-forge/` directory:

```bash
# Frontend development
npm run dev          # Start Next.js development server with Turbopack
npm run build        # Build the application for production
npm run start        # Start production server
npm run lint         # Run ESLint for code quality

# Python backend
# No specific commands - Vercel Functions are deployed automatically
# Local testing requires Vercel CLI
```

## Key Architecture Components

### Frontend Architecture (`src/`)
- **Main Page**: `src/app/page.tsx` - Handles stat input form and solution display
- **Form Component**: `src/components/stat-input-form.tsx` - Complex form with Zod validation, stat sliders, exotic perk selection, and subclass-fragment selection
- **Solution Display**: `src/components/solution-display.tsx` - Shows optimization results
- **Subclass Fragments**: `src/lib/fragments.ts` (data model + baseline-stat math) and `src/components/fragment-list.tsx` (picker)
- **UI Components**: `src/components/ui/` - Radix-based shadcn/ui components; the custom "Forge Console" primitives live in `src/components/forge/`
- **Theme System**: Uses next-themes with dark/light mode support

### Backend Architecture (`api/`)
- **Optimize Endpoint**: `api/optimize.py` - POST `/api/optimize` handler; applies rate limiting and caching, then calls the solver
- **Main Optimizer**: `api/main.py` - Core MILP optimization using PuLP library
- **Exotic Data**: `api/exotic_class_items.py` - Fixed exotic class item stat distributions
- **Exotic Perks**: `api/exotic-perks.py` - GET `/api/exotic-perks` endpoint, returns valid perk combinations
- **Stats Info**: `api/stats-info.py` - Stat information endpoints
- **Caching**: `api/cache.py` - File-based response cache (`/tmp`), 2-hour TTL; keyed by SHA256 of the request
- **Rate Limiting**: `api/rate_limiter.py` - In-memory per-IP limiter (4 requests / 60s)

Note: cache files in `/tmp` and the in-memory rate-limiter state are ephemeral on Vercel — they do not persist reliably across serverless invocations or instances, so both are best-effort.

### State Management
- **Form State**: React Hook Form with Zod validation
- **Solution State**: Local component state (useState)
- **Theme State**: next-themes provider

### Data Flow
1. User inputs desired stats via StatInputForm
2. Form data sent to `/api/optimize` Vercel Function
3. Python MILP solver finds optimal armor combinations
4. Results displayed in SolutionDisplay component

## Destiny 2 Domain Knowledge

### Armor System Constraints
- 5 armor pieces: Helmet, Arms, Chestpiece, Leggings, Class Item
- 6 stats: Health, Melee, Grenade, Super, Class, Weapons
- Total stat pool: 500 points base (100 per piece)
- Max per piece: 45 (30 primary + 10 mod + 5 tuning)

### Armor Archetypes
Each piece's archetype fixes its primary (30) and secondary (25) stats. There are 12,
defined in `ARCHETYPES` in `api/main.py` (the source of truth):
- **Brawler**: Melee (30) + Health (25)
- **Bulwark**: Health (30) + Class (25)
- **Grenadier**: Grenade (30) + Super (25)
- **Paragon**: Super (30) + Melee (25)
- **Gunner**: Weapons (30) + Grenade (25)
- **Specialist**: Class (30) + Weapons (25)
- **Siegebreaker**: Health (30) + Grenade (25)
- **Skirmisher**: Melee (30) + Weapons (25)
- **Demolitionist**: Grenade (30) + Class (25)
- **Colossus**: Super (30) + Health (25)
- **Reaver**: Class (30) + Melee (25)
- **Powerhouse**: Weapons (30) + Super (25)

### Modification System
- **Standard Mod**: +10 to any stat
- **Tuning Mod**: Transfer 5 points between stats
- **Balanced Tuning**: +1 to three lowest stats

### Subclass Fragments
- Fragments shift a player's **baseline** stats by a fixed amount (+10 / -10 / -20 to one
  or two stats); data lives in `src/lib/fragments.ts` (all 6 subclasses).
- Only one subclass's fragments may be equipped at a time; there is no fixed count limit.
- The solver subtracts the fragment baseline from the desired/minimum targets before
  solving, then folds it back into reported stats so totals compare like-for-like.
- Because fragments can net positive, they raise the achievable MAX above the armor-only
  515 (the form's max meter is dynamic).

### Exotic Armor
- Regular exotic armor shares the legendary 30/25/20/5/5/5 roll and the full tuning set,
  so a stat-identical legendary always exists — the optimizer therefore does not offer a
  "require a regular exotic" option; only the **exotic class item** is user-selectable.
- Exotic class items have fixed perk combinations that determine their stat roll
  (`api/exotic_class_items.py`), and can take any tuning mod (no dedicated/random roll).

## Key Dependencies

### Frontend
- **Next.js 15**: React framework with App Router
- **TypeScript**: Type safety
- **Tailwind CSS 4**: Styling
- **React Hook Form + Zod**: Form validation
- **Radix UI**: Accessible component primitives
- **shadcn/ui**: Component library built on Radix

### Backend
- **PuLP**: Mixed Integer Linear Programming solver
- **CBC Solver**: Optimization engine

## Development Notes

### Form Validation
The StatInputForm component includes complex validation for:
- Stat totals (0-225 per stat, max 515 total before fragment shifts)
- Exotic perk combinations (specific valid pairs)
- Subclass-fragment selection (single subclass at a time)
- Minimum constraint locks

### Optimization Logic
The solver in `main.py` uses a two-phase approach:
1. **Exact solutions**: No timeout, finds perfect matches
2. **Approximate solutions**: Time-limited search for closest approximations. The production `/api/optimize` endpoint passes `total_timeout=15` (15 seconds); `solve_with_milp_multiple()` itself defaults to 120s.

### API Integration
Frontend communicates with Vercel Functions at `/api/optimize` endpoint, passing:
- Desired stat distribution
- Optimization preferences (tuning, exotic class item toggle)
- Minimum constraints
- Exotic perk selections
- Selected subclass and fragments

### Styling System
Uses Tailwind with CSS variables for theming. Dark mode supported via next-themes.