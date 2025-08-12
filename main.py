from itertools import product
from collections import namedtuple

try:
    import pulp
    HAS_PULP = True
except ImportError:
    HAS_PULP = False

STAT_NAMES = ["Health", "Melee", "Grenade", "Super", "Class", "Weapons"]
STAT_IDX = {s: i for i, s in enumerate(STAT_NAMES)}

Archetype = namedtuple("Archetype", ["name", "primary_stat", "secondary_stat"])
ARCHETYPES = [
    Archetype("Brawler", "Melee", "Health"),
    Archetype("Bulwark", "Health", "Class"),
    Archetype("Grenadier", "Grenade", "Weapons"),
    Archetype("Paragon", "Super", "Melee"),
    Archetype("Gunner", "Weapons", "Grenade"),
    Archetype("Specialist", "Class", "Weapons"),
]

PRIMARY_VAL = 30
SECONDARY_VAL = 25
TERTIARY_VAL = 20
BASE_FIVE = 5
STANDARD_MOD_VAL = 10
TUNING_VAL = 5
MAX_PER_PIECE = PRIMARY_VAL + STANDARD_MOD_VAL + TUNING_VAL  # 45

PieceType = namedtuple("PieceType", ["arch", "tertiary", "mod_target", "tuned_stat", "siphon_from"])


def generate_piece_types():
    """Generate all possible armor piece configurations with meaningful tuning or no tuning."""
    piece_types = []
    piece_stats = {}
    for arch in ARCHETYPES:
        arch_primary = arch.primary_stat
        arch_secondary = arch.secondary_stat
        tertiary_choices = [s for s in STAT_NAMES if s not in (arch_primary, arch_secondary)]

        for tertiary in tertiary_choices:
            # base stats before mods/tuning
            base = [0] * 6
            base[STAT_IDX[arch_primary]] = PRIMARY_VAL
            base[STAT_IDX[arch_secondary]] = SECONDARY_VAL
            base[STAT_IDX[tertiary]] = TERTIARY_VAL
            for s in STAT_NAMES:
                if s not in (arch_primary, arch_secondary, tertiary):
                    base[STAT_IDX[s]] = BASE_FIVE

            for mod_target in STAT_NAMES:
                mod_applied = base.copy()
                mod_applied[STAT_IDX[mod_target]] += STANDARD_MOD_VAL

                # find siphon-eligible stats (base-5s after mod)
                base5_stats = [s for s in STAT_NAMES if mod_applied[STAT_IDX[s]] == BASE_FIVE]

                # Option 1: no tuning at all
                stats_no_tuning = tuple(mod_applied)
                p_no_tuning = PieceType(arch.name, tertiary, mod_target, None, None)
                piece_types.append(p_no_tuning)
                piece_stats[p_no_tuning] = stats_no_tuning

                # Option 2: meaningful tuning (donor != tuned)
                for tuned in STAT_NAMES:
                    for donor in base5_stats:
                        if donor == tuned:
                            continue  # skip meaningless siphon
                        stats_after = mod_applied.copy()
                        stats_after[STAT_IDX[donor]] -= TUNING_VAL
                        stats_after[STAT_IDX[tuned]] += TUNING_VAL
                        if any(sv < 0 or sv > MAX_PER_PIECE for sv in stats_after):
                            continue
                        p = PieceType(arch.name, tertiary, mod_target, tuned, donor)
                        piece_types.append(p)
                        piece_stats[p] = tuple(stats_after)
    return piece_types, piece_stats


def normalize_solution(sol):
    """Remove cosmetic differences."""
    norm = {}
    for p, count in sol.items():
        norm[p] = norm.get(p, 0) + count
    return norm


def difficulty_score(sol):
    """Lower is better: fewer distinct types, no tuning."""
    distinct_types = len(sol)
    tuning_count = sum(1 for p in sol if p.tuned_stat is not None and p.siphon_from is not None)
    return distinct_types * 10 + tuning_count


def identical_piece_check(desired_totals, piece_types, piece_stats):
    """Return solution if exactly 5 of one piece type matches desired totals."""
    for p in piece_types:
        stats = piece_stats[p]
        if all(stats[i] * 5 == desired_totals[i] for i in range(6)):
            return {p: 5}
    return None


def solve_with_milp_multiple(desired_totals, piece_types, piece_stats, max_solutions=5):
    if not HAS_PULP:
        raise RuntimeError("pulp not installed; can't run MILP")

    solutions = []

    # Pre-check: all identical piece solution
    identical_sol = identical_piece_check(desired_totals, piece_types, piece_stats)
    if identical_sol:
        solutions.append(identical_sol)

    exclusions = []
    while len(solutions) < max_solutions:
        prob = pulp.LpProblem("DestinyArmor3", pulp.LpMinimize)
        x_vars = {p: pulp.LpVariable(f"x_{i}", lowBound=0, upBound=5, cat="Integer")
                  for i, p in enumerate(piece_types)}

        # core constraints
        prob += pulp.lpSum(x_vars[p] for p in piece_types) == 5
        for si in range(6):
            prob += pulp.lpSum(x_vars[p] * piece_stats[p][si] for p in piece_types) == desired_totals[si]

        # objective: minimize farm difficulty
        prob += pulp.lpSum(x_vars[p] * (10 if p.tuned_stat is None else 0) for p in piece_types) * -1

        # exclusion constraints from prior solutions
        for excl in exclusions:
            prob += pulp.lpSum([x_vars[p] for p in excl]) <= 4

        prob.solve()

        if pulp.LpStatus[prob.status] != "Optimal":
            break

        sol = {p: int(round(x_vars[p].value())) for p in piece_types if x_vars[p].value() > 0.5}
        norm_sol = normalize_solution(sol)
        if norm_sol not in solutions:
            solutions.append(norm_sol)
        exclusions.append(list(sol.keys()))

    # Sort all found solutions by farmability
    solutions.sort(key=difficulty_score)
    return solutions


def format_solution(sol):
    lines = []
    for p, count in sol.items():
        if p.tuned_stat is None:
            lines.append(f"{count}x {p.arch} (tertiary={p.tertiary}) mod+10->{p.mod_target} No Tuning")
        else:
            lines.append(f"{count}x {p.arch} (tertiary={p.tertiary}) mod+10->{p.mod_target} tuned->{p.tuned_stat} siphon_from={p.siphon_from}")
    return "\n".join(lines)


# Example usage
if __name__ == "__main__":
    desired = {
        "Health": 150,
        "Melee": 75,
        "Grenade": 75,
        "Super": 100,
        "Class": 75,
        "Weapons": 25
    }
    desired_vec = [desired[s] for s in STAT_NAMES]
    piece_types, piece_stats = generate_piece_types()
    print(f"Generated {len(piece_types)} piece configurations.")

    sols = solve_with_milp_multiple(desired_vec, piece_types, piece_stats, max_solutions=5)
    if not sols:
        print("No solutions found.")
    else:
        for i, s in enumerate(sols, 1):
            print(f"\nSolution {i}:")
            print(format_solution(s))
