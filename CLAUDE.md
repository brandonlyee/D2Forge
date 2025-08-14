# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

D2 Forge is a Destiny 2 armor build optimization tool that uses Mixed Integer Linear Programming (MILP) to find optimal armor configurations. The tool generates armor piece combinations to achieve desired stat distributions for the 6 stats: Health, Melee, Grenade, Super, Class, and Weapons.

## Commands

**Run the optimizer:**
```bash
python3 main.py
```

**Install required dependency:**
```bash
pip install pulp
```

**Run tests:**
```bash
python3 test.py
```

## Architecture

### Core Components

**Archetype System:**
- 6 archetype classes (Brawler, Bulwark, Grenadier, Paragon, Gunner, Specialist)
- Each has a primary stat (30 points) and secondary stat (25 points)
- Remaining stats distributed as tertiary (20 points) or base (5 points)

**Piece Generation (`generate_piece_types()`):**
- Creates all possible armor configurations (1944 total combinations)
- Each piece can have mods (+10 to any stat) and tuning (transfer 5 points between stats)
- Only generates meaningful tuning combinations (donor ≠ target stat)

**MILP Solver (`solve_with_milp_multiple()`):**
- Uses PuLP library for optimization
- Finds multiple solutions ranked by farming difficulty
- Prefers non-tuned pieces (easier to farm)
- Falls back to approximate solutions if exact match impossible

**Solution Ranking:**
- Primary: fewer distinct piece types (easier farming)
- Secondary: fewer tuned pieces (easier farming)
- Tertiary: statistical deviation from target (for approximate solutions)

### Key Data Structures

- `PieceType`: namedtuple defining piece configuration (archetype, tertiary stat, mod target, tuning details)
- `piece_stats`: maps each PieceType to its 6-stat array
- Solutions returned as `{PieceType: count}` dictionaries

### Dependencies

- `pulp`: Required for MILP optimization (gracefully handles missing dependency)
- `itertools`, `collections`: Standard library utilities

