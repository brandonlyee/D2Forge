from collections import namedtuple, defaultdict

try:
    import pulp
    HAS_PULP = True
except ImportError:
    HAS_PULP = False

# ----------------------------
# Problem constants
# ----------------------------
STAT_NAMES = ["Health", "Melee", "Grenade", "Super", "Class", "Weapons"]
STAT_IDX = {s: i for i, s in enumerate(STAT_NAMES)}

Archetype = namedtuple("Archetype", ["name", "primary_stat", "secondary_stat"])
ARCHETYPES = [
    Archetype("Brawler", "Melee", "Health"),
    Archetype("Bulwark", "Health", "Class"),
    Archetype("Grenadier", "Grenade", "Super"),
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

# tuning_mode: "none" | "tuned" | "balanced"
PieceType = namedtuple(
    "PieceType",
    [
        "arch",          # archetype name
        "tertiary",      # tertiary stat name
        "tuning_mode",   # none | tuned | balanced
        "tuned_stat",    # if tuned: which stat receives +5
        "siphon_from",   # if tuned: which stat gives -5
        "mod_target",    # +10 standard mod target (kept for MILP math only)
    ],
)


# ----------------------------
# Piece generation (now supports Balanced Tuning correctly)
# ----------------------------

def generate_piece_types(allow_tuned=True):
    """Generate all armor piece configurations including:
    - no tuning
    - +5/-5 reallocation tuning (if allow_tuned=True)
    - Balanced Tuning (+1 to the three lowest *base* stats, independent of +10 mod)

    Args:
        allow_tuned: If False, excludes +5/-5 tuning pieces to reduce farming difficulty

    Notes:
    * For reallocation tuning, we allow siphoning FROM ANY stat with at least 5 points
      after the +10 mod is applied (including primary/secondary/tertiary),
      provided the result stays within [0, 45]. This matches examples like
      "siphon_from=Health".
    * Balanced Tuning ignores the +10 mod to determine "lowest" stats. In this 3.0 model,
      those are exactly the three stats that are NOT primary/secondary/tertiary.
    """
    piece_types = []
    piece_stats = {}

    for arch in ARCHETYPES:
        prim = arch.primary_stat
        sec = arch.secondary_stat
        tert_choices = [s for s in STAT_NAMES if s not in (prim, sec)]

        for tert in tert_choices:
            # Base distribution BEFORE +10 and BEFORE any tuning
            base = [0] * 6
            base[STAT_IDX[prim]] = PRIMARY_VAL
            base[STAT_IDX[sec]] = SECONDARY_VAL
            base[STAT_IDX[tert]] = TERTIARY_VAL
            for s in STAT_NAMES:
                if s not in (prim, sec, tert):
                    base[STAT_IDX[s]] = BASE_FIVE

            # The three lowest base stats for Balanced Tuning are exactly the three
            # that are neither prim/sec/tert.
            balanced_low_indices = [STAT_IDX[s] for s in STAT_NAMES if s not in (prim, sec, tert)]

            for mod_target in STAT_NAMES:
                # Apply +10 standard mod AFTER evaluating which stats Balanced boosts
                mod_applied = base.copy()
                mod_applied[STAT_IDX[mod_target]] += STANDARD_MOD_VAL

                # (A) No tuning
                p_none = PieceType(arch.name, tert, "none", None, None, mod_target)
                piece_types.append(p_none)
                piece_stats[p_none] = tuple(mod_applied)

                # (B) +5/-5 tuning (reallocation) - only if allowed
                if allow_tuned:
                    # Allow ANY donor with value >= 5 after mod (includes prim/sec/tert if eligible)
                    donor_candidates = [s for s in STAT_NAMES if mod_applied[STAT_IDX[s]] >= TUNING_VAL]
                    for tuned in STAT_NAMES:
                        for donor in donor_candidates:
                            if donor == tuned:
                                continue
                            stats_after = mod_applied.copy()
                            stats_after[STAT_IDX[donor]] -= TUNING_VAL
                            stats_after[STAT_IDX[tuned]] += TUNING_VAL
                            # Validate bounds per piece
                            if any((v < 0 or v > MAX_PER_PIECE) for v in stats_after):
                                continue
                            p_tuned = PieceType(arch.name, tert, "tuned", tuned, donor, mod_target)
                            piece_types.append(p_tuned)
                            piece_stats[p_tuned] = tuple(stats_after)

                # (C) Balanced Tuning: +1 to the three lowest *base* stats
                stats_bal = mod_applied.copy()
                for idx in balanced_low_indices:
                    stats_bal[idx] += 1
                p_bal = PieceType(arch.name, tert, "balanced", None, None, mod_target)
                piece_types.append(p_bal)
                piece_stats[p_bal] = tuple(stats_bal)

    return piece_types, piece_stats


# ----------------------------
# Helpers
# ----------------------------

def normalize_solution(sol):
    # Keep pieces distinct by all fields, but compact same descriptors
    norm = {}
    for p, c in sol.items():
        norm[p] = norm.get(p, 0) + c
    return norm


def difficulty_score(sol):
    """Lower is better: fewer distinct types; only 'tuned' increases difficulty.
    We reward 'none' and 'balanced' equally (easiest to farm).
    """
    distinct_types = len(sol)
    tuning_count = sum(1 for p in sol if p.tuning_mode == "tuned")
    return distinct_types * 10 + tuning_count


def identical_piece_check(desired_totals, piece_types, piece_stats):
    """Return a solution if exactly 5 of a single piece type matches totals."""
    for p in piece_types:
        stats = piece_stats[p]
        if all(stats[i] * 5 == desired_totals[i] for i in range(6)):
            return {p: 5}
    return None


# ----------------------------
# MILP solver (exact + approximate)
# ----------------------------

def solve_with_milp_multiple(desired_totals, piece_types, piece_stats, max_solutions=5, allow_tuned=True):
    if not HAS_PULP:
        raise RuntimeError("pulp not installed; can't run MILP")

    solutions = []
    deviations = []

    # Fast-path: all-identical pieces
    ident = identical_piece_check(desired_totals, piece_types, piece_stats)
    if ident:
        solutions.append(ident)
        deviations.append(0.0)

    exclusions = []

    def solve_problem(allow_deviation=False):
        # Correct sense argument (avoid the earlier bug)
        prob = pulp.LpProblem("DestinyArmor3", pulp.LpMinimize)
        x = {p: pulp.LpVariable(f"x_{i}", lowBound=0, upBound=5, cat="Integer")
             for i, p in enumerate(piece_types)}

        if allow_deviation:
            dev_pos = {s: pulp.LpVariable(f"dev_pos_{s}", lowBound=0) for s in STAT_NAMES}
            dev_neg = {s: pulp.LpVariable(f"dev_neg_{s}", lowBound=0) for s in STAT_NAMES}

        # exactly 5 pieces
        prob += pulp.lpSum(x[p] for p in piece_types) == 5

        # stat matching
        for si, s in enumerate(STAT_NAMES):
            total_stat = pulp.lpSum(x[p] * piece_stats[p][si] for p in piece_types)
            if allow_deviation:
                prob += total_stat - desired_totals[si] == dev_pos[s] - dev_neg[s]
            else:
                prob += total_stat == desired_totals[si]

        # objective
        if allow_deviation:
            # minimize total deviation; tiny tie-break to prefer easy pieces
            deviation_cost = pulp.lpSum(dev_pos[s] + dev_neg[s] for s in STAT_NAMES)
            ease_bonus = pulp.lpSum(x[p] * (1 if p.tuning_mode != "tuned" else 0) for p in piece_types)
            prob += deviation_cost - 0.01 * ease_bonus
        else:
            # prefer easier farming (none/balanced), then fewer distinct types implicitly via exclusions
            ease_bonus = pulp.lpSum(x[p] * (1 if p.tuning_mode != "tuned" else 0) for p in piece_types)
            prob += -1 * ease_bonus

        # exclude prior complete selections
        for excl in exclusions:
            prob += pulp.lpSum(x[p] for p in excl) <= 4

        prob.solve()
        if pulp.LpStatus[prob.status] != "Optimal":
            return None, None

        sol = {p: int(round(x[p].value())) for p in piece_types if x[p].value() and x[p].value() > 0.5}
        dev_total = 0.0
        if allow_deviation:
            dev_total = sum((dev_pos[s].value() or 0) + (dev_neg[s].value() or 0) for s in STAT_NAMES)
        return normalize_solution(sol), dev_total

    # Phase 1: find exact solutions
    while len(solutions) < max_solutions:
        sol, dev = solve_problem(allow_deviation=False)
        if not sol:
            break
        if sol not in solutions:
            solutions.append(sol)
            deviations.append(dev)
        exclusions.append(list(sol.keys()))

    # Phase 2: approximate solutions if none found
    if not solutions:
        exclusions = []  # reset exclusions
        while len(solutions) < 3: # approximate solutions take long, only produce 3
            sol, dev = solve_problem(allow_deviation=True)
            if not sol:
                break
            if sol not in solutions:
                solutions.append(sol)
                deviations.append(dev)
            exclusions.append(list(sol.keys()))

    # sort by farmability then deviation
    combined = list(zip(solutions, deviations))
    combined.sort(key=lambda sd: (difficulty_score(sd[0]), sd[1]))
    if combined:
        solutions, deviations = zip(*combined)
        solutions, deviations = list(solutions), list(deviations)
    else:
        solutions, deviations = [], []

    return solutions, deviations


# ----------------------------
# Reporting
# ----------------------------

def calculate_actual_stats(sol, piece_stats):
    actual = [0] * 6
    for p, c in sol.items():
        vec = piece_stats[p]
        for i in range(6):
            actual[i] += vec[i] * c
    return actual


def format_solution(sol, deviation=0.0, desired_stats=None, piece_stats=None):
    armor_lines = []
    mods = defaultdict(int)  # group +10 mods by stat only (hidden from piece lines)
    
    # Group identical pieces by their string representation for display
    piece_groups = defaultdict(int)
    for p, count in sol.items():
        if p.tuning_mode == "balanced":
            key = f"{p.arch} (tertiary={p.tertiary}) (tuning=ANY) Balanced Tuning (+1 to 3 lowest stats)"
        elif p.tuning_mode == "tuned":
            key = f"{p.arch} (tertiary={p.tertiary}) (tuning={p.tuned_stat}) +{p.tuned_stat}/-{p.siphon_from}"
        else:
            key = f"{p.arch} (tertiary={p.tertiary}) (tuning=ANY) No Tuning"
        piece_groups[key] += count
        mods[p.mod_target] += count
    
    # Create armor lines from grouped pieces
    for piece_desc, total_count in piece_groups.items():
        armor_lines.append(f"{total_count}x {piece_desc}")

    lines = []
    lines.extend(armor_lines)
    lines.append("\nMods:")
    for stat, cnt in mods.items():
        lines.append(f"{cnt}x +10->{stat}")

    if deviation and deviation > 0:
        lines.append(f"\nTotal deviation from desired stats: {deviation:.1f}")
        if desired_stats is not None and piece_stats is not None:
            actual = calculate_actual_stats(sol, piece_stats)
            lines.append("\nStat Distribution:")
            lines.append("Stat      | Actual | Desired | Difference")
            lines.append("----------|--------|---------|----------")
            for i, name in enumerate(STAT_NAMES):
                diff = actual[i] - desired_stats[i]
                lines.append(f"{name:<9} | {actual[i]:6} | {desired_stats[i]:7} | {diff:+6}")
            lines.append("----------|--------|---------|----------")
            lines.append(f"{'Total':<9} | {sum(actual):6} | {sum(desired_stats):7} | {sum(actual)-sum(desired_stats):+6}")
    else:
        lines.append("\nExact match")

    return "\n".join(lines)


# ----------------------------
# Example manual run
# ----------------------------
if __name__ == "__main__":
    desired = {
        "Health": 160,
        "Melee": 155,
        "Grenade": 30,
        "Super": 110,
        "Class": 30,
        "Weapons": 30,
    }
    desired_vec = [desired[s] for s in STAT_NAMES]

    # Test both with and without +5/-5 tuning
    for allow_tuned in [True, False]:
        tuning_mode = "with +5/-5 tuning" if allow_tuned else "without +5/-5 tuning"
        print(f"\n{'='*60}")
        print(f"Testing {tuning_mode}")
        print(f"{'='*60}")
        
        piece_types, piece_stats = generate_piece_types(allow_tuned=allow_tuned)
        print(f"Generated {len(piece_types)} piece configurations.")

        sols, devs = solve_with_milp_multiple(desired_vec, piece_types, piece_stats, max_solutions=5, allow_tuned=allow_tuned)
        if not sols:
            print("No solutions found.")
        else:
            for i, (s, d) in enumerate(zip(sols, devs), 1):
                print(f"\nSolution {i}:")
                print(format_solution(s, d, desired_vec, piece_stats))
