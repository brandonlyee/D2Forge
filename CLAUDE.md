# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Structure

This is D2 Forge, a Destiny 2 armor build optimizer deployed on Vercel. The project has a hybrid architecture:

- **Frontend**: Next.js 15 with TypeScript (`d2-forge/` directory)
- **Backend**: Python Vercel Functions for optimization (`d2-forge/api/` directory)
- **Working Directory**: Always work from `/Users/brandonyee/PycharmProjects/D2Forge/d2-forge/` for all operations

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
- **Form Component**: `src/components/stat-input-form.tsx` - Complex form with Zod validation, stat sliders, exotic perk selection
- **Solution Display**: `src/components/solution-display.tsx` - Shows optimization results
- **UI Components**: `src/components/ui/` - Radix-based shadcn/ui components
- **Theme System**: Uses next-themes with dark/light mode support

### Backend Architecture (`api/`)
- **Main Optimizer**: `api/main.py` - Core MILP optimization using PuLP library
- **Exotic Data**: `api/exotic_class_items.py` - Fixed exotic class item stat distributions
- **Stats Info**: `api/stats-info.py` - Stat information endpoints

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
- **Brawler**: Melee (30) + Health (25) 
- **Bulwark**: Health (30) + Class (25)
- **Grenadier**: Grenade (30) + Weapons (25)
- **Paragon**: Super (30) + Melee (25)
- **Gunner**: Weapons (30) + Grenade (25)
- **Specialist**: Class (30) + Weapons (25)

### Modification System
- **Standard Mod**: +10 to any stat
- **Tuning Mod**: Transfer 5 points between stats
- **Balanced Tuning**: +1 to three lowest stats

### Exotic Armor
- Different stat distribution: 30/20/13/5/5/5
- No tuning slots available
- Exotic class items have fixed perk combinations

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
- Stat totals (0-225 per stat, max 515 total)
- Exotic perk combinations (specific valid pairs)
- Minimum constraint locks

### Optimization Logic
The solver in `main.py` uses a two-phase approach:
1. **Exact solutions**: No timeout, finds perfect matches
2. **Approximate solutions**: 30-second timeout for closest approximations

### API Integration
Frontend communicates with Vercel Functions at `/api/optimize` endpoint, passing:
- Desired stat distribution
- Optimization preferences (tuning, exotic options)
- Minimum constraints
- Exotic perk selections

### Styling System
Uses Tailwind with CSS variables for theming. Dark mode supported via next-themes.