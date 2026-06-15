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
    Archetype("Siegebreaker", "Health", "Grenade"),
    Archetype("Skirmisher", "Melee", "Weapons"),
    Archetype("Demolitionist", "Grenade", "Class"),
    Archetype("Colossus", "Super", "Health"),
    Archetype("Reaver", "Class", "Melee"),
    Archetype("Powerhouse", "Weapons", "Super"),
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
        "arch",  # archetype name
        "tertiary",  # tertiary stat name
        "tuning_mode",  # none | tuned | balanced
        "tuned_stat",  # if tuned: which stat receives +5
        "siphon_from",  # if tuned: which stat gives -5
        "mod_target",  # +10 standard mod target (kept for MILP math only)
        "slot",  # None for solver-chosen pieces; "armor"/"class" for user-locked pieces
    ],
    defaults=(None,),  # ``slot`` defaults to None so existing 6-arg construction still works
)

# Fixed rolls for Exotic Class Item (subset)
# Import exotic class item configurations from separate file
from exotic_class_items import CLASS_ITEM_ROLLS


def is_exotic_class_item(arch):
    """True for the Exotic Class Item — the only exotic the solver models as a distinct piece.
    Its stat roll is fixed by the perk pair, but (like every other piece) it can still take any
    tuning mod. Regular exotic armor is not modeled separately: post-update it shares the exact
    30/25/20 distribution and tuning set of legendary armor, so requiring one would never change
    the achievable stat space."""
    return str(arch).lower().startswith("exotic class item")


# ----------------------------
# Piece generation (now supports Balanced Tuning correctly)
# ----------------------------

def _add_piece_variants(piece_types, piece_stats, label, tert, base, balanced_low_indices, allow_tuned):
    """Append every tuning variant for a single base roll (one label + tertiary).

    For each +10 mod target this emits the three tuning modes shared by *all* pieces —
    normal armor, regular exotic armor, and the Exotic Class Item alike:
      (A) none     — open tuning slot, no mod applied (can later take any +5/-5 mod)
      (B) tuned    — a specific +5/-5 transfer already applied (only if ``allow_tuned``)
      (C) balanced — Balanced Tuning, +1 to the three lowest stats

    ``base`` is the 6-stat roll BEFORE the +10 mod and BEFORE tuning; ``balanced_low_indices``
    are the indices that Balanced Tuning bumps by +1.
    """
    for mod_target in STAT_NAMES:
        mod_applied = base.copy()
        mod_applied[STAT_IDX[mod_target]] += STANDARD_MOD_VAL

        # (A) No tuning
        p_none = PieceType(label, tert, "none", None, None, mod_target)
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
                    p_tuned = PieceType(label, tert, "tuned", tuned, donor, mod_target)
                    piece_types.append(p_tuned)
                    piece_stats[p_tuned] = tuple(stats_after)

        # (C) Balanced Tuning (+1 to three non-prim/sec/tert)
        stats_bal = mod_applied.copy()
        for idx in balanced_low_indices:
            stats_bal[idx] += 1
        p_bal = PieceType(label, tert, "balanced", None, None, mod_target)
        piece_types.append(p_bal)
        piece_stats[p_bal] = tuple(stats_bal)


def _add_archetype_pieces(piece_types, piece_stats, arch, allow_tuned):
    """Append every piece configuration for a single archetype to the accumulators.

    Used for legendary armor, which has the 30 / 25 / 20 / 5 / 5 / 5 distribution and the full
    set of tuning modes (none, +5/-5 tuned, balanced). Regular exotic armor shares this exact
    profile post-update, so it is not generated separately — only the Exotic Class Item, whose
    perk-determined roll is a genuine constraint, is modeled as a distinct exotic piece.
    """
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

        _add_piece_variants(piece_types, piece_stats, arch.name, tert, base, balanced_low_indices, allow_tuned)


def generate_piece_types(allow_tuned=True, *, use_class_item_exotic=False, exotic_perks=None):
    """Generate all armor piece configurations.

    Normal armor (always generated):
      - modes: none, tuned (if allow_tuned), balanced
      - stats: 30 / 25 / 20 / 5 / 5 / 5 (before +10)
    Exotic Class Item (only when ``use_class_item_exotic``):
      - stat roll is fixed by the perk pair (from CLASS_ITEM_ROLLS), but it supports the
        full set of tuning modes (none, tuned, balanced) like any other piece, plus the
        +10 mod slot

    Regular exotic armor is intentionally not generated: post-update it shares the legendary
    30/25/20 distribution and tuning set exactly, so a stat-identical legendary swap always
    exists — requiring one could never change the achievable stat space.
    """
    piece_types = []
    piece_stats = {}

    # --- Normal piece generation (with Balanced Tuning) ---
    for arch in ARCHETYPES:
        _add_archetype_pieces(piece_types, piece_stats, arch, allow_tuned)

    # --- Exotic Class Item generation ---
    if use_class_item_exotic:
        if exotic_perks not in CLASS_ITEM_ROLLS:
            raise ValueError("exotic_perks must be a (perk1, perk2) tuple present in CLASS_ITEM_ROLLS")
        prim, sec, tert = CLASS_ITEM_ROLLS[exotic_perks]
        # Fixed stat roll from the perk pair, but with a full tuning slot like any piece.
        base = [BASE_FIVE] * 6
        base[STAT_IDX[prim]] = PRIMARY_VAL
        base[STAT_IDX[sec]] = SECONDARY_VAL
        base[STAT_IDX[tert]] = TERTIARY_VAL
        balanced_low_indices = [STAT_IDX[s] for s in STAT_NAMES if s not in (prim, sec, tert)]
        label = f"Exotic Class Item ({exotic_perks[0]} + {exotic_perks[1]})"
        _add_piece_variants(piece_types, piece_stats, label, tert, base, balanced_low_indices, allow_tuned)

    return piece_types, piece_stats


# ----------------------------
# User-locked pieces ("build around these")
# ----------------------------

ARCHETYPE_BY_NAME = {a.name: a for a in ARCHETYPES}

# The five concrete gear slots. Each user-locked piece occupies exactly one; "class" is the
# class-item slot (and the only one that conflicts with an exotic class item).
LOCKED_SLOTS = ["helmet", "arms", "chest", "legs", "class"]


def _locked_piece_variants(spec):
    """Build every solver variant for a single user-locked piece.

    A locked piece is one the player already owns and wants every build to include. Its
    archetype + tertiary (the farmed roll) and its tuning *intent* are fixed by the user; the
    +10 mod target — and, for a specific +5 tuning, the −5 donor — are still chosen by the
    optimizer. We therefore emit one variant per (mod_target [, siphon]) combination consistent
    with the spec, all tagged with the piece's concrete ``slot`` so they stay distinct from
    solver-chosen pieces (and from each other) and can be surfaced as "owned" downstream.

    Because ``slot`` is part of the piece identity, two locked pieces never collapse into one
    variable even when their rolls are identical — they live in different gear slots.

    ``spec`` keys:
      arch        archetype name (must be in ARCHETYPES)
      tertiary    tertiary stat name (must differ from the archetype's primary/secondary)
      slot        one of LOCKED_SLOTS — the gear slot this owned piece occupies
      tuning_mode "none" | "balanced" | "tuned" | "flexible"
      tuned_stat  target stat for the +5 (required when tuning_mode == "tuned")

    Unlike normal/exotic pieces, locked tuning is honoured regardless of the global
    ``allow_tuned`` toggle — the user explicitly curated these pieces.

    Returns a list of (PieceType, stats_tuple). Raises ValueError on an invalid spec.
    """
    arch_name = spec.get("arch")
    arch = ARCHETYPE_BY_NAME.get(arch_name)
    if arch is None:
        raise ValueError(f"Unknown locked-piece archetype: {arch_name!r}")
    prim, sec = arch.primary_stat, arch.secondary_stat

    tert = spec.get("tertiary")
    if tert not in STAT_NAMES or tert in (prim, sec):
        raise ValueError(
            f"Invalid tertiary {tert!r} for {arch_name}: must be a stat other than {prim}/{sec}"
        )

    tuning_mode = spec.get("tuning_mode", "none")
    if tuning_mode not in ("none", "balanced", "tuned", "flexible"):
        raise ValueError(f"Invalid locked-piece tuning_mode: {tuning_mode!r}")
    tuned_stat = spec.get("tuned_stat")
    if tuning_mode == "tuned":
        if tuned_stat not in STAT_NAMES:
            raise ValueError(f"tuning_mode 'tuned' requires a valid tuned_stat, got {tuned_stat!r}")

    slot = spec.get("slot")
    if slot not in LOCKED_SLOTS:
        raise ValueError(f"Invalid locked-piece slot {slot!r}: must be one of {LOCKED_SLOTS}")

    base = [BASE_FIVE] * 6
    base[STAT_IDX[prim]] = PRIMARY_VAL
    base[STAT_IDX[sec]] = SECONDARY_VAL
    base[STAT_IDX[tert]] = TERTIARY_VAL
    balanced_low_indices = [STAT_IDX[s] for s in STAT_NAMES if s not in (prim, sec, tert)]

    variants = []
    for mod_target in STAT_NAMES:
        mod_applied = base.copy()
        mod_applied[STAT_IDX[mod_target]] += STANDARD_MOD_VAL

        def add(tmode, t_stat, donor, stats):
            p = PieceType(arch_name, tert, tmode, t_stat, donor, mod_target, slot)
            variants.append((p, tuple(stats)))

        if tuning_mode in ("none", "flexible"):
            add("none", None, None, mod_applied)

        if tuning_mode == "balanced":
            stats_bal = mod_applied.copy()
            for idx in balanced_low_indices:
                stats_bal[idx] += 1
            add("balanced", None, None, stats_bal)

        if tuning_mode in ("tuned", "flexible"):
            # Fixed +5 target ("tuned") or every +5 target ("flexible"); optimizer picks the donor.
            target_stats = [tuned_stat] if tuning_mode == "tuned" else list(STAT_NAMES)
            donor_candidates = [s for s in STAT_NAMES if mod_applied[STAT_IDX[s]] >= TUNING_VAL]
            for t_stat in target_stats:
                for donor in donor_candidates:
                    if donor == t_stat:
                        continue
                    stats_after = mod_applied.copy()
                    stats_after[STAT_IDX[donor]] -= TUNING_VAL
                    stats_after[STAT_IDX[t_stat]] += TUNING_VAL
                    if any((v < 0 or v > MAX_PER_PIECE) for v in stats_after):
                        continue
                    add("tuned", t_stat, donor, stats_after)

    return variants


def add_locked_pieces(piece_types, piece_stats, locked_pieces):
    """Register user-locked pieces into the solver pools and return their constraint groups.

    ``locked_pieces`` is a list of spec dicts (see ``_locked_piece_variants``). Each piece
    occupies a distinct gear slot, so every piece becomes its own group requiring exactly one
    selection. Returns a list of ``(variant_piece_types, required_count)`` tuples; the caller
    adds one equality constraint per group (sum of the group's variables == 1) so every build
    contains exactly the locked pieces. Mutates ``piece_types``/``piece_stats`` in place.

    Raises ValueError if two locked pieces claim the same slot.
    """
    if not locked_pieces:
        return []

    seen_slots = set()
    groups = []
    for spec in locked_pieces:
        slot = spec.get("slot")
        if slot in seen_slots:
            raise ValueError(f"Two locked pieces both use the {slot!r} slot")
        seen_slots.add(slot)

        variants = _locked_piece_variants(spec)
        group_vars = []
        for p, stats in variants:
            piece_types.append(p)
            piece_stats[p] = stats
            group_vars.append(p)
        groups.append((group_vars, 1))
    return groups


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
    # User-locked pieces (slot set) are already owned, so they carry no farming cost and are
    # excluded from both the distinct-type and tuned-piece penalties.
    distinct_types = sum(1 for p in sol if getattr(p, "slot", None) is None)
    tuning_count = sum(1 for p in sol if p.tuning_mode == "tuned" and getattr(p, "slot", None) is None)
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
                             require_class_item=False, total_timeout=120, minimum_constraints=None,
                             exact_timeout=None, locked_groups=None, ignored_stats=None):
    """Find up to ``max_solutions`` armor builds for ``desired_totals``.

    Two phases, each independently time-bounded so the solve can never run unbounded:
      * Phase 1 (exact)       — bounded by ``exact_timeout`` (seconds; None = no limit).
      * Phase 2 (approximate) — bounded by ``total_timeout``, only runs if Phase 1 found nothing.

    ``exact_timeout`` defaults to None to preserve exhaustive behaviour for direct/standalone
    callers; the production endpoint passes an explicit value so a hard target cannot grind
    until the serverless function is killed.
    """
    if not HAS_PULP:
        raise RuntimeError("pulp not installed; can't run MILP")

    # Ignored stats are "don't care" dump stats: no exact-match, no deviation penalty, and
    # no minimum floor. The solver is free to route tuning points out of them to feed the
    # stats the user actually cares about.
    ignored = set(ignored_stats or [])

    start_time = time.time()
    
    solutions = []
    deviations = []

    # Fast-path identical only when no exotic class item and no locked pieces are required
    # (both force specific pieces into the build, so "5 of one type" can't apply).
    if not require_class_item and not locked_groups:
        ident = identical_piece_check(desired_totals, piece_types, piece_stats)
        if ident:
            solutions.append(ident)
            deviations.append(0.0)

    exclusions = []

    def solve_problem(allow_deviation=False, time_limit=None):
        # ``time_limit`` is the wall-clock budget (seconds) for this single CBC call;
        # None means no limit. Both phases pass an explicit budget in production so the
        # solver can never run unbounded (see the Phase 1 / Phase 2 loops below).
        prob = pulp.LpProblem("DestinyArmor3", pulp.LpMinimize)
        x = {p: pulp.LpVariable(f"x_{i}", lowBound=0, upBound=5, cat="Integer")
             for i, p in enumerate(piece_types)}

        if allow_deviation:
            dev_pos = {s: pulp.LpVariable(f"dev_pos_{s}", lowBound=0) for s in STAT_NAMES}
            dev_neg = {s: pulp.LpVariable(f"dev_neg_{s}", lowBound=0) for s in STAT_NAMES}

        # exactly 5 pieces
        prob += pulp.lpSum(x[p] for p in piece_types) == 5

        # require exactly one exotic class item if requested
        if require_class_item:
            class_item_vars = [x[p] for p in piece_types if is_exotic_class_item(p.arch)]
            if class_item_vars:
                prob += pulp.lpSum(class_item_vars) == 1
            else:
                return None, None

        # require user-locked pieces: each group must contribute exactly its requested count,
        # so every build is "built around" the owned pieces and fills the rest optimally.
        if locked_groups:
            for group_vars, count in locked_groups:
                prob += pulp.lpSum(x[p] for p in group_vars) == count

        # stat matching (ignored stats get no constraint at all — left fully free)
        for si, s in enumerate(STAT_NAMES):
            if s in ignored:
                continue
            total_stat = pulp.lpSum(x[p] * piece_stats[p][si] for p in piece_types)
            if allow_deviation:
                prob += total_stat - desired_totals[si] == dev_pos[s] - dev_neg[s]
            else:
                prob += total_stat == desired_totals[si]

        # minimum constraints (must be satisfied even with deviation; never applied to
        # ignored stats, which by definition have no floor)
        if minimum_constraints:
            for si, s in enumerate(STAT_NAMES):
                if s in ignored:
                    continue
                min_value = minimum_constraints.get(s)
                if min_value is not None:
                    total_stat = pulp.lpSum(x[p] * piece_stats[p][si] for p in piece_types)
                    prob += total_stat >= min_value

        # objective (prefer easier pieces)
        ease_bonus = pulp.lpSum(x[p] * (1 if getattr(p, 'tuning_mode', 'none') != "tuned" else 0) for p in piece_types)
        if allow_deviation:
            # Weight negative deviations (missing stats) much more heavily than positive (excess stats)
            # Missing stats hurt builds significantly more than having extra stats.
            # Ignored stats are excluded entirely so neither over- nor under-shooting them costs anything.
            deviation_cost = pulp.lpSum(0.2 * dev_pos[s] + 5.0 * dev_neg[s]
                                        for s in STAT_NAMES if s not in ignored)
            prob += deviation_cost - 0.01 * ease_bonus
        else:
            prob += -1 * ease_bonus

        # exclude prior exact selections
        for excl in exclusions:
            prob += pulp.lpSum(x[p] for p in excl) <= 4

        if time_limit is not None:
            prob.solve(pulp.PULP_CBC_CMD(msg=False, timeLimit=max(1.0, time_limit)))
        else:
            prob.solve(pulp.PULP_CBC_CMD(msg=False))  # No limit
        if pulp.LpStatus[prob.status] not in ["Optimal", "Not Solved"]:
            return None, None

        sol = {p: int(round(x[p].value())) for p in piece_types if x[p].value() and x[p].value() > 0.5}
        dev_total = 0.0
        if allow_deviation:
            # Apply same weighting as in objective: negative deviations are much worse than positive.
            # Ignored stats are excluded so a meaningless "miss" on them doesn't pollute ranking.
            dev_total = sum(0.2 * (dev_pos[s].value() or 0) + 5.0 * (dev_neg[s].value() or 0)
                            for s in STAT_NAMES if s not in ignored)
        return normalize_solution(sol), dev_total

    # Phase 1: find exact solutions, bounded by ``exact_timeout`` (None = unbounded).
    # Previously this phase had no time limit at all, so a target with no easily-found exact
    # match (or one that is slow to prove infeasible) could grind until the platform killed
    # the function. Each solve now gets the remaining exact budget as its CBC time limit,
    # and the loop stops once that budget is spent.
    exact_deadline = (start_time + exact_timeout) if exact_timeout is not None else None
    while len(solutions) < max_solutions:
        if exact_deadline is not None:
            remaining = exact_deadline - time.time()
            if remaining <= 0:
                break
        else:
            remaining = None
        sol, dev = solve_problem(allow_deviation=False, time_limit=remaining)
        if not sol:
            break
        if sol not in solutions:
            solutions.append(sol)
            deviations.append(dev)
        exclusions.append(list(sol.keys()))

    # Phase 2: approximations if no exact match was found, bounded by ``total_timeout``.
    if not solutions:
        exclusions = []
        phase2_start = time.time()
        while len(solutions) < max_solutions:
            remaining = total_timeout - (time.time() - phase2_start)
            if remaining <= 0:
                break
            sol, dev = solve_problem(allow_deviation=True, time_limit=remaining)
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
        # The Exotic Class Item's arch label already reads "Exotic Class Item (...)", so no
        # extra prefix is needed to flag it.
        if p.tuning_mode == "balanced":
            key = f"{p.arch} (tertiary={p.tertiary}) Balanced Tuning (+1 to 3 lowest stats)"
        elif p.tuning_mode == "tuned":
            key = f"{p.arch} (tertiary={p.tertiary}) No specific tuning required"
            # Track the tuning requirement separately
            tuning_requirements[p.tuned_stat] += count
            # This piece can be flexible for other tuning needs
            flexible_pieces += count
        else:
            key = f"{p.arch} (tertiary={p.tertiary}) No tuning required"
            # Every piece (including the Exotic Class Item) has an open tuning slot and
            # can accept any +5/-5 tuning mod.
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
    use_class_item_exotic = True  # Toggle using an exotic class item
    exotic_perks = ("Spirit of Inmost Light", "Spirit of Cyrtarachne")           # Only used if use_class_item_exotic=True, e.g. ("Spirit of Inmost Light", "Spirit of Synthoceps")

    print(f"\n{'='*60}")
    print(f"Testing configuration:")
    print(f"allow_tuned = {allow_tuned}")
    print(f"use_class_item_exotic = {use_class_item_exotic}")
    if use_class_item_exotic:
        print(f"exotic_perks = {exotic_perks}")
    print(f"{'='*60}")

    piece_types, piece_stats = generate_piece_types(
        allow_tuned=allow_tuned,
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
        require_class_item=use_class_item_exotic,
        total_timeout=30  # 30 second timeout for Phase 2 only
    )
    if not sols:
        print("No solutions found.")
    else:
        for i, (s, d) in enumerate(zip(sols, devs), 1):
            print(f"\nSolution {i}:")
            print(format_solution(s, d, desired_vec, piece_stats))

