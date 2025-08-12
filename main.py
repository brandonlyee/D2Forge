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
    deviations = []

    # Pre-check: all identical piece solution
    identical_sol = identical_piece_check(desired_totals, piece_types, piece_stats)
    if identical_sol:
        solutions.append(identical_sol)
        deviations.append(0.0)

    exclusions = []

    def solve_problem(allow_deviation=False):
        prob = pulp.LpProblem("DestinyArmor3", pulp.LpMinimize)
        x_vars = {p: pulp.LpVariable(f"x_{i}", lowBound=0, upBound=5, cat="Integer")
                  for i, p in enumerate(piece_types)}

        if allow_deviation:
            # Add positive and negative deviation variables for each stat
            dev_pos = {s: pulp.LpVariable(f"dev_pos_{s}", lowBound=0) for s in STAT_NAMES}
            dev_neg = {s: pulp.LpVariable(f"dev_neg_{s}", lowBound=0) for s in STAT_NAMES}

        # core constraints
        prob += pulp.lpSum(x_vars[p] for p in piece_types) == 5

        for si, stat in enumerate(STAT_NAMES):
            stat_sum = pulp.lpSum(x_vars[p] * piece_stats[p][si] for p in piece_types)
            if allow_deviation:
                # Allow deviation: actual = desired + positive_dev - negative_dev
                prob += stat_sum - desired_totals[si] == dev_pos[stat] - dev_neg[stat]
            else:
                # Exact constraint
                prob += stat_sum == desired_totals[si]

        if allow_deviation:
            # Minimize total deviation with small farming difficulty tiebreaker
            deviation_cost = pulp.lpSum(dev_pos[s] + dev_neg[s] for s in STAT_NAMES)
            farm_cost = pulp.lpSum(x_vars[p] * (10 if p.tuned_stat is None else 0) for p in piece_types) * -0.01
            prob += deviation_cost + farm_cost
        else:
            # Minimize farm difficulty
            prob += pulp.lpSum(x_vars[p] * (10 if p.tuned_stat is None else 0) for p in piece_types) * -1

        # exclusion constraints from prior solutions
        for excl in exclusions:
            prob += pulp.lpSum([x_vars[p] for p in excl]) <= 4

        prob.solve()

        if pulp.LpStatus[prob.status] != "Optimal":
            return None, None

        sol = {p: int(round(x_vars[p].value())) for p in piece_types if x_vars[p].value() > 0.5}
        
        if allow_deviation:
            dev_total = sum(dev_pos[s].value() + dev_neg[s].value() for s in STAT_NAMES)
        else:
            dev_total = 0.0

        return normalize_solution(sol), dev_total

    # Phase 1: Try to find exact solutions
    while len(solutions) < max_solutions:
        sol, dev = solve_problem(allow_deviation=False)
        if not sol:
            break
        if sol not in solutions:
            solutions.append(sol)
            deviations.append(dev)
        exclusions.append(list(sol.keys()))

    # Phase 2: If no exact solutions found, try approximate solutions
    if not solutions:
        print("No exact match found - trying closest match.")
        exclusions = []  # Reset exclusions for approximate search
        while len(solutions) < 3:
            sol, dev = solve_problem(allow_deviation=True)
            if not sol:
                break
            if sol not in solutions:
                solutions.append(sol)
                deviations.append(dev)
            exclusions.append(list(sol.keys()))

    # Sort all found solutions by farmability, then by deviation
    combined = list(zip(solutions, deviations))
    combined.sort(key=lambda x: (difficulty_score(x[0]), x[1]))
    solutions, deviations = zip(*combined) if combined else ([], [])

    return list(solutions), list(deviations)


def calculate_actual_stats(sol, piece_stats):
    """Calculate the actual stat distribution achieved by a solution."""
    actual_stats = [0] * 6
    for piece, count in sol.items():
        piece_stat_array = piece_stats[piece]
        for stat_idx in range(6):
            actual_stats[stat_idx] += piece_stat_array[stat_idx] * count
    return actual_stats


def format_solution(sol, deviation=0.0, desired_stats=None, piece_stats=None):
    lines = []
    for p, count in sol.items():
        if p.tuned_stat is None:
            lines.append(f"{count}x {p.arch} (tertiary={p.tertiary}) mod+10->{p.mod_target} No Tuning")
        else:
            lines.append(f"{count}x {p.arch} (tertiary={p.tertiary}) mod+10->{p.mod_target} tuned->{p.tuned_stat} siphon_from={p.siphon_from}")
    
    if deviation > 0:
        lines.append(f"\nTotal deviation from desired stats: {deviation:.1f}")
        
        # Show stat distribution comparison if we have the data
        if desired_stats is not None and piece_stats is not None:
            actual_stats = calculate_actual_stats(sol, piece_stats)
            lines.append("\nStat Distribution:")
            lines.append("Stat      | Actual | Desired | Difference")
            lines.append("----------|--------|---------|----------")
            
            for stat_idx, stat_name in enumerate(STAT_NAMES):
                actual = actual_stats[stat_idx]
                desired = desired_stats[stat_idx]
                diff = actual - desired
                lines.append(f"{stat_name:<9} | {actual:6} | {desired:7} | {diff:+6}")
            
            actual_total = sum(actual_stats)
            desired_total = sum(desired_stats)
            diff_total = actual_total - desired_total
            lines.append("----------|--------|---------|----------")
            lines.append(f"{'Total':<9} | {actual_total:6} | {desired_total:7} | {diff_total:+6}")
    else:
        lines.append("\nExact match")
    
    return "\n".join(lines)


# Example usage
if __name__ == "__main__":
    desired = {
        "Health": 0,
        "Melee": 170,
        "Grenade": 130,
        "Super": 25,
        "Class": 25,
        "Weapons": 150
    }
    desired_vec = [desired[s] for s in STAT_NAMES]
    piece_types, piece_stats = generate_piece_types()
    print(f"Generated {len(piece_types)} piece configurations.")

    sols, devs = solve_with_milp_multiple(desired_vec, piece_types, piece_stats, max_solutions=5)
    if not sols:
        print("No solutions found.")
    else:
        for i, (s, d) in enumerate(zip(sols, devs), 1):
            print(f"\nSolution {i}:")
            print(format_solution(s, d, desired_vec, piece_stats))
