# Project Overview

D2 Forge is a Destiny 2 Edge of Fate Armor 3.0 Build Optimizer, that takes in a set of character stats as input, and outputs solutions containing what specific gear is required in order to achieve the inputted stats. Solutions are scored by difficulty to obtain, where multiple armor archetypes, or requiring tuning mods increases difficulty. The solutions with the lowest difficulty are output.

# Destiny 2 Edge of Fate Armor 3.0 

## Core System
* 5 armor pieces: Helmet, Arms, Chestpiece, Leggings, Class Item
* 6 character stats: Health, Melee, Grenade, Super, Class, Weapons
* Total stat pool: 500 points (100 per armor piece)
## Armor Archetypes (6 types)
Each piece must be one of these archetypes, which determines primary and secondary stats:
* Brawler: Melee (30) primary, Health (25) secondary
* Bulwark: Health (30) primary, Class (25) secondary
* Grenadier: Grenade (30) primary, Weapons (25) secondary
* Paragon: Super (30) primary, Melee (25) secondary
* Gunner: Weapons (30) primary, Grenade (25) secondary
* Specialist: Class (30) primary, Weapons (25) secondary
## Stat Distribution per Piece (Base)
* Primary stat: 30 points (determined by archetype)
* Secondary stat: 25 points (determined by archetype)
* Tertiary stat: 20 points (randomly selected from the 4 remaining stats)
* Other 3 stats: 5 points each
* Base total: 90 points per piece
## Modification System
Each armor piece has 2 mod slots:
1. Standard Mod Slot: +10 to any stat of choice
2. Tuning Slot:
   * For every armor piece, regardless of archetype, one stat will be the "tuned stat". For that stat, you can take 5 points from any of the other 5 stats, and allocate it to the tuned stat. The tuned stat can be any of the 6 stats on the armor, regardless of what the primary, secondary, and tertiary stats are.
   * Each piece has one randomly assigned "tuned stat"
   * Can transfer 5 points FROM any stat with at least 5 points TO the tuned stat
   * Cannot siphon from primary, secondary, or tertiary stats (they're above 5)
   * Can only siphon from the three base stats (those with 5 points) 
   * We can choose to NOT use the tuning mod if desired. This is usually preferred, as tuning slots add another layer of RNG when farming for specific armor pieces.


## Key Constraints
* Maximum per stat per piece: 45 (30 primary + 10 mod + 5 tuning)
* Minimum per stat per piece: 0 (if siphoned by tuning)
* Total always equals: 500 across all pieces
## Strategic Implications
* Stats requiring 40+ per piece (200+ total) MUST use specific archetypes
* Extreme distributions often require coordinated tuning across multiple pieces
* Some distributions are impossible (e.g., any single stat over 200 total)
* Tuning is critical for achieving 0 in a stat or maximizing beyond standard limits

This system creates a complex optimization puzzle where achieving specific stat distributions requires careful selection of archetypes, tertiary stats, mods, and tuning configurations.

## Tips for finding optimal armor combinations:
* When deciding on armor archetypes, take into account the given stat distributions and decide accordingly. For example, if the desired stat line has a lot of grenade, then grenadier is an obvious choice, but gunner is too since it has grenade as a secondary stat. And if it also has lots of weapons, then gunner is likely more optimal than grenadier. We can also mix and match different archetypes to achieve statlines.

## Example Armor Statlines
Here are some example stat lines, and how they can be achieved:

### Example 1
#### Stat totals:
0 Health
200 Melee
100 Grenade
150 Super
25 Class
25 Weapons

#### Armor:
5 x Paragon with a grenade tertiary stat, each with a melee tuning to siphon 5 points from health to melee and a +10 brawler mod
i.e., each armor piece will have the followings stats
0 Health (Siphoned to melee)
40 Melee (Secondary stat + 5 for tuning)
20 Grenade (Tertiary stat)
30 Super (Primary stat)
5 Class
5 Weapons

### Example 2
#### Stat totals:
125 Health
150 Melee
75 Grenade
100 Super
25 Class
25 Weapons

#### Armor:
5 x Brawler with a super tertiary stat, each with a +10 grenadier mod and no tuning mod.
i.e., each armor piece will have the following stats:
25 Health 
30 Melee 
15 Grenade
20 Super
5 Class
5 Weapons

# Architecture

## Frontend
- **Next.js 15** with TypeScript
- **Tailwind CSS** for styling
- **React Hook Form** with Zod validation
- **Deployed on Vercel**

## Backend  
- **Vercel Functions** with Python 3.9+
- **PuLP optimization library** with CBC solver
- **Mixed Integer Linear Programming** for optimal solutions
- **Auto-scaling** serverless functions

## Key Features
- **Exact optimization** using MILP algorithms
- **Exotic class item support** with conditional perk selection  
- **Minimum stat constraints** with lock toggles
- **Balanced tuning** support (+1 to three lowest stats)
- **Difficulty scoring** (tuned vs non-tuned pieces)
- **30-second timeout** for complex optimizations
- **Approximate solutions** when exact matches impossible
