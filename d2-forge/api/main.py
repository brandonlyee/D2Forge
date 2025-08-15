from collections import namedtuple, defaultdict
import time

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

# Exotic-specific constants
EXOTIC_SECONDARY_VAL = 20
EXOTIC_TERTIARY_VAL = 13

# tuning_mode: "none" | "tuned" | "balanced"
PieceType = namedtuple(
    "PieceType",
    [
        "arch",  # archetype name
        "tertiary",  # tertiary stat name
        "tuning_mode",  # none | tuned | balanced
        "tuned_stat",  # if tuned: which stat receives +5
        "siphon_from",  # if tuned: which stat gives -5
        "mod_target",  # +10 standard mod target (kept for MILP math only)
    ],
)

# Fixed rolls for Exotic Class Item (subset)
# Import exotic class item configurations from separate file
from exotic_class_items import CLASS_ITEM_ROLLS


# ----------------------------
# Piece generation (now supports Balanced Tuning correctly)
# ----------------------------

def generate_piece_types(allow_tuned=True, *, use_exotic=False, use_class_item_exotic=False, exotic_perks=None):
    """Generate all armor piece configurations.

    Normal armor:
      - modes: none, tuned (if allow_tuned), balanced
    Exotic (non-class-item):
      - modes: none only (no tuning slot)
      - exactly one may be used when solver is called with require_exotic=True
      - stats: 30 / 20 / 13 / 5 / 5 / 5 (before +10)
    Exotic Class Item:
      - single fixed roll from CLASS_ITEM_ROLLS, modes: none only
      - still has +10 mod slot
    """
    piece_types = []
    piece_stats = {}

    # --- Normal piece generation (with Balanced Tuning) ---
    for arch in ARCHETYPES:
        prim = arch.primary_stat
        sec = arch.secondary_stat
        tert_choices = [s for s in STAT_NAMES if s not in (prim, sec)]

        for tert in tert_choices:
            # Base BEFORE +10 and BEFORE tuning
            base = [0] * 6
            base[STAT_IDX[prim]] = PRIMARY_VAL
            base[STAT_IDX[sec]] = SECONDARY_VAL
            base[STAT_IDX[tert]] = TERTIARY_VAL
            for s in STAT_NAMES:
                if s not in (prim, sec, tert):
                    base[STAT_IDX[s]] = BASE_FIVE

            # For Balanced Tuning, lowest three are non-prim/sec/tert
            balanced_low_indices = [STAT_IDX[s] for s in STAT_NAMES if s not in (prim, sec, tert)]

            for mod_target in STAT_NAMES:
                mod_applied = base.copy()
                mod_applied[STAT_IDX[mod_target]] += STANDARD_MOD_VAL

                # (A) No tuning
                p_none = PieceType(arch.name, tert, "none", None, None, mod_target)
                piece_types.append(p_none)
                piece_stats[p_none] = tuple(mod_applied)

                # (B) +5/-5 tuning (if allowed)
                if allow_tuned:
                    donor_candidates = [s for s in STAT_NAMES if mod_applied[STAT_IDX[s]] >= TUNING_VAL]
                    for tuned in STAT_NAMES:
                        for donor in donor_candidates:
                            if donor == tuned:
                                continue
                            stats_after = mod_applied.copy()
                            stats_after[STAT_IDX[donor]] -= TUNING_VAL
                            stats_after[STAT_IDX[tuned]] += TUNING_VAL
                            if any((v < 0 or v > MAX_PER_PIECE) for v in stats_after):
                                continue
                            p_tuned = PieceType(arch.name, tert, "tuned", tuned, donor, mod_target)
                            piece_types.append(p_tuned)
                            piece_stats[p_tuned] = tuple(stats_after)

                # (C) Balanced Tuning (+1 to three non-prim/sec/tert)
                stats_bal = mod_applied.copy()
                for idx in balanced_low_indices:
                    stats_bal[idx] += 1
                p_bal = PieceType(arch.name, tert, "balanced", None, None, mod_target)
                piece_types.append(p_bal)
                piece_stats[p_bal] = tuple(stats_bal)

    # --- Exotic generation ---
    if use_exotic:
        if use_class_item_exotic:
            if exotic_perks not in CLASS_ITEM_ROLLS:
                raise ValueError("exotic_perks must be a (perk1, perk2) tuple present in CLASS_ITEM_ROLLS")
            prim, sec, tert = CLASS_ITEM_ROLLS[exotic_perks]
            base = [BASE_FIVE] * 6
            base[STAT_IDX[prim]] = PRIMARY_VAL
            base[STAT_IDX[sec]] = EXOTIC_SECONDARY_VAL
            base[STAT_IDX[tert]] = EXOTIC_TERTIARY_VAL
            for mod_target in STAT_NAMES:
                mod_applied = base.copy()
                mod_applied[STAT_IDX[mod_target]] += STANDARD_MOD_VAL
                label = f"Exotic Class Item ({exotic_perks[0]} + {exotic_perks[1]})"
                p_none = PieceType(label, tert, "none", None, None, mod_target)
                piece_types.append(p_none)
                piece_stats[p_none] = tuple(mod_applied)
        else:
            # Generate exotic alternatives for each archetype (no tuning for exotics)
            for arch in ARCHETYPES:
                prim = arch.primary_stat
                sec = arch.secondary_stat
                tert_choices = [s for s in STAT_NAMES if s not in (prim, sec)]
                for tert in tert_choices:
                    base = [BASE_FIVE] * 6
                    base[STAT_IDX[prim]] = PRIMARY_VAL
                    base[STAT_IDX[sec]] = EXOTIC_SECONDARY_VAL
                    base[STAT_IDX[tert]] = EXOTIC_TERTIARY_VAL
                    for mod_target in STAT_NAMES:
                        mod_applied = base.copy()
                        mod_applied[STAT_IDX[mod_target]] += STANDARD_MOD_VAL
                        label = f"Exotic {arch.name}"
                        p_none = PieceType(label, tert, "none", None, None, mod_target)
                        piece_types.append(p_none)
                        piece_stats[p_none] = tuple(mod_applied)

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
    """Lower is better: fewer distinct types; tuned pieces are significantly harder to farm.
    Tuned pieces require: right archetype (1/6) + right tertiary (1/4) + right tuning (1/6) = 1/144 chance
    Non-tuned pieces require: right archetype (1/6) + right tertiary (1/4) = 1/24 chance
    So tuned pieces are ~6x harder to farm than distinct piece types.
    """
    distinct_types = len(sol)
    tuning_count = sum(1 for p in sol if p.tuning_mode == "tuned")
    return distinct_types * 10 + tuning_count * 60  # 60 points per tuned piece vs 10 per distinct type


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

def solve_with_milp_multiple(desired_totals, piece_types, piece_stats, max_solutions=10, allow_tuned=True,
                             require_exotic=False, total_timeout=120, minimum_constraints=None):
    if not HAS_PULP:
        raise RuntimeError("pulp not installed; can't run MILP")

    start_time = time.time()
    
    solutions = []
    deviations = []

    # Fast-path identical only when no exotic is required
    if not require_exotic:
        ident = identical_piece_check(desired_totals, piece_types, piece_stats)
        if ident:
            solutions.append(ident)
            deviations.append(0.0)

    exclusions = []

    def solve_problem(allow_deviation=False, use_timeout=False):
        if use_timeout:
            # Calculate remaining time for this solver call
            elapsed = time.time() - start_time
            remaining_time = max(10, total_timeout - elapsed)  # At least 10 seconds per call
        else:
            remaining_time = None  # No timeout for exact solutions
        prob = pulp.LpProblem("DestinyArmor3", pulp.LpMinimize)
        x = {p: pulp.LpVariable(f"x_{i}", lowBound=0, upBound=5, cat="Integer")
             for i, p in enumerate(piece_types)}

        if allow_deviation:
            dev_pos = {s: pulp.LpVariable(f"dev_pos_{s}", lowBound=0) for s in STAT_NAMES}
            dev_neg = {s: pulp.LpVariable(f"dev_neg_{s}", lowBound=0) for s in STAT_NAMES}

        # exactly 5 pieces
        prob += pulp.lpSum(x[p] for p in piece_types) == 5

        # require exactly one exotic if requested
        if require_exotic:
            exotic_vars = [x[p] for p in piece_types if str(p.arch).lower().startswith("exotic ")]
            if exotic_vars:
                prob += pulp.lpSum(exotic_vars) == 1
            else:
                return None, None

        # stat matching
        for si, s in enumerate(STAT_NAMES):
            total_stat = pulp.lpSum(x[p] * piece_stats[p][si] for p in piece_types)
            if allow_deviation:
                prob += total_stat - desired_totals[si] == dev_pos[s] - dev_neg[s]
            else:
                prob += total_stat == desired_totals[si]
        
        # minimum constraints (must be satisfied even with deviation)
        if minimum_constraints:
            for si, s in enumerate(STAT_NAMES):
                min_value = minimum_constraints.get(s)
                if min_value is not None:
                    total_stat = pulp.lpSum(x[p] * piece_stats[p][si] for p in piece_types)
                    prob += total_stat >= min_value

        # objective (prefer easier pieces)
        ease_bonus = pulp.lpSum(x[p] * (1 if getattr(p, 'tuning_mode', 'none') != "tuned" else 0) for p in piece_types)
        if allow_deviation:
            # Weight negative deviations (missing stats) much more heavily than positive (excess stats)
            # Missing stats hurt builds significantly more than having extra stats
            deviation_cost = pulp.lpSum(0.2 * dev_pos[s] + 5.0 * dev_neg[s] for s in STAT_NAMES)
            prob += deviation_cost - 0.01 * ease_bonus
        else:
            prob += -1 * ease_bonus

        # exclude prior exact selections
        for excl in exclusions:
            prob += pulp.lpSum(x[p] for p in excl) <= 4

        if remaining_time is not None:
            prob.solve(pulp.PULP_CBC_CMD(msg=True, timeLimit=remaining_time))
        else:
            prob.solve(pulp.PULP_CBC_CMD(msg=True))  # No timeout
        if pulp.LpStatus[prob.status] not in ["Optimal", "Not Solved"]:
            return None, None

        sol = {p: int(round(x[p].value())) for p in piece_types if x[p].value() and x[p].value() > 0.5}
        dev_total = 0.0
        if allow_deviation:
            # Apply same weighting as in objective: negative deviations are much worse than positive
            dev_total = sum(0.2 * (dev_pos[s].value() or 0) + 5.0 * (dev_neg[s].value() or 0) for s in STAT_NAMES)
        return normalize_solution(sol), dev_total

    # Phase 1: find exact solutions (no timeout)
    while len(solutions) < max_solutions:
        sol, dev = solve_problem(allow_deviation=False)
        if not sol:
            break
        if sol not in solutions:
            solutions.append(sol)
            deviations.append(dev)
        exclusions.append(list(sol.keys()))

    # Phase 2: approximations if needed (with timeout)
    if not solutions:
        exclusions = []
        # Reset start time for Phase 2 timeout
        start_time = time.time()
        while len(solutions) < max_solutions:
            # Check if we've exceeded total timeout
            if time.time() - start_time >= total_timeout:
                break
                
            sol, dev = solve_problem(allow_deviation=True, use_timeout=True)
            if not sol:
                break
            if sol not in solutions:
                solutions.append(sol)
                deviations.append(dev)
            exclusions.append(list(sol.keys()))

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
    mods = defaultdict(int)  # group +10 mods by stat only
    tuning_requirements = defaultdict(int)  # track +5/-5 tuning requirements
    flexible_pieces = 0  # count pieces that can accept any +5/-5 tuning

    # Group identical pieces by their string representation for display
    piece_groups = defaultdict(int)
    for p, count in sol.items():
        if p.tuning_mode == "balanced":
            prefix = "[EXOTIC] " if str(p.arch).lower().startswith("exotic ") else ""
            key = f"{prefix}{p.arch} (tertiary={p.tertiary}) Balanced Tuning (+1 to 3 lowest stats)"
        elif p.tuning_mode == "tuned":
            prefix = "[EXOTIC] " if str(p.arch).lower().startswith("exotic ") else ""
            key = f"{prefix}{p.arch} (tertiary={p.tertiary}) No specific tuning required"
            # Track the tuning requirement separately
            tuning_requirements[p.tuned_stat] += count
            # This piece can be flexible for other tuning needs
            flexible_pieces += count
        else:
            prefix = "[EXOTIC] " if str(p.arch).lower().startswith("exotic ") else ""
            key = f"{prefix}{p.arch} (tertiary={p.tertiary}) No tuning required"
            # Non-exotic, non-balanced pieces can accept any +5/-5 tuning
            if not str(p.arch).lower().startswith("exotic "):
                flexible_pieces += count
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

    # Add tuning requirements section if there are any +5/-5 tunings needed
    if tuning_requirements:
        lines.append("\nTuning Requirements:")
        total_tuning_needed = sum(tuning_requirements.values())
        for stat, cnt in tuning_requirements.items():
            lines.append(f"{cnt}x +5/-5 Tuning -> {stat}")
        lines.append(f"\nNote: {total_tuning_needed} total +5/-5 tuning mod(s) needed.")
        if flexible_pieces >= total_tuning_needed:
            lines.append(f"You have {flexible_pieces} piece(s) that can accept any +5/-5 tuning.")
        else:
            lines.append(f"Warning: Only {flexible_pieces} flexible piece(s) available for {total_tuning_needed} tuning requirement(s).")

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
            lines.append(
                f"{'Total':<9} | {sum(actual):6} | {sum(desired_stats):7} | {sum(actual) - sum(desired_stats):+6}")
    else:
        lines.append("\nExact match")

    return "\n".join(lines)


# ----------------------------
# Example manual run
# ----------------------------
if __name__ == "__main__":
    desired = {
        "Health": 25,
        "Melee": 90,
        "Grenade": 180,
        "Super": 100,
        "Class": 80,
        "Weapons": 25,
    }
    desired_vec = [desired[s] for s in STAT_NAMES]

    # User-configurable options
    allow_tuned = True            # Toggle +5/-5 tuning
    use_exotic = True             # Toggle using an exotic piece
    use_class_item_exotic = True # Toggle using an exotic class item
    exotic_perks = ("Spirit of Inmost Light", "Spirit of Cyrtarachne")           # Only used if use_class_item_exotic=True, e.g. ("Spirit of Inmost Light", "Spirit of Synthoceps")

    print(f"\n{'='*60}")
    print(f"Testing configuration:")
    print(f"allow_tuned = {allow_tuned}")
    print(f"use_exotic = {use_exotic}")
    print(f"use_class_item_exotic = {use_class_item_exotic}")
    if use_class_item_exotic:
        print(f"exotic_perks = {exotic_perks}")
    print(f"{'='*60}")

    piece_types, piece_stats = generate_piece_types(
        allow_tuned=allow_tuned,
        use_exotic=use_exotic,
        use_class_item_exotic=use_class_item_exotic,
        exotic_perks=exotic_perks
    )
    print(f"Generated {len(piece_types)} piece configurations.")

    sols, devs = solve_with_milp_multiple(
        desired_vec,
        piece_types,
        piece_stats,
        max_solutions=10,
        allow_tuned=allow_tuned,
        require_exotic=use_exotic,
        total_timeout=30  # 30 second timeout for Phase 2 only
    )
    if not sols:
        print("No solutions found.")
    else:
        for i, (s, d) in enumerate(zip(sols, devs), 1):
            print(f"\nSolution {i}:")
            print(format_solution(s, d, desired_vec, piece_stats))

