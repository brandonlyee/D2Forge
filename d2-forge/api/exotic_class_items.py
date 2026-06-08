"""
Exotic Class Item Perk Combinations

This file contains every valid exotic class item perk combination.
Map format: (perk1, perk2) -> (primary_stat, secondary_stat, tertiary_stat)

The left perk (perk1) fixes the archetype, i.e. the primary (+30) and secondary
(+25) stats. The right perk (perk2) grants the tertiary (+20) stat: the highest-
priority stat in its list that is not already the primary or secondary.

Class-exclusive perks cannot be mixed across classes: a Hunter-only left perk can
only pair with Hunter-only or class-agnostic right perks, and so on. Class-agnostic
perks pair with anything.
"""

CLASS_ITEM_ROLLS = {
    # === Class-agnostic left perks ===

    # Spirit of the Assassin (Brawler)
    ("Spirit of the Assassin", "Spirit of the Star-Eater"): ("Melee", "Health", "Super"),
    ("Spirit of the Assassin", "Spirit of Synthoceps"): ("Melee", "Health", "Class"),
    ("Spirit of the Assassin", "Spirit of Verity"): ("Melee", "Health", "Grenade"),
    ("Spirit of the Assassin", "Spirit of the Coyote"): ("Melee", "Health", "Class"),
    ("Spirit of the Assassin", "Spirit of Cyrtarachne"): ("Melee", "Health", "Grenade"),
    ("Spirit of the Assassin", "Spirit of the Gyrfalcon"): ("Melee", "Health", "Weapons"),
    ("Spirit of the Assassin", "Spirit of the Liar"): ("Melee", "Health", "Class"),
    ("Spirit of the Assassin", "Spirit of the Wormhusk"): ("Melee", "Health", "Class"),
    ("Spirit of the Assassin", "Spirit of Alpha Lupi"): ("Melee", "Health", "Class"),
    ("Spirit of the Assassin", "Spirit of Contact"): ("Melee", "Health", "Grenade"),
    ("Spirit of the Assassin", "Spirit of Scars"): ("Melee", "Health", "Weapons"),
    ("Spirit of the Assassin", "Spirit of the Armamentarium"): ("Melee", "Health", "Grenade"),
    ("Spirit of the Assassin", "Spirit of the Horn"): ("Melee", "Health", "Class"),
    ("Spirit of the Assassin", "Spirit of Harmony"): ("Melee", "Health", "Weapons"),
    ("Spirit of the Assassin", "Spirit of Starfire"): ("Melee", "Health", "Grenade"),
    ("Spirit of the Assassin", "Spirit of the Claw"): ("Melee", "Health", "Class"),
    ("Spirit of the Assassin", "Spirit of the Swarm"): ("Melee", "Health", "Grenade"),
    ("Spirit of the Assassin", "Spirit of Vesper"): ("Melee", "Health", "Class"),

    # Spirit of Inmost Light (Paragon)
    ("Spirit of Inmost Light", "Spirit of the Star-Eater"): ("Super", "Melee", "Weapons"),
    ("Spirit of Inmost Light", "Spirit of Synthoceps"): ("Super", "Melee", "Health"),
    ("Spirit of Inmost Light", "Spirit of Verity"): ("Super", "Melee", "Grenade"),
    ("Spirit of Inmost Light", "Spirit of the Coyote"): ("Super", "Melee", "Class"),
    ("Spirit of Inmost Light", "Spirit of Cyrtarachne"): ("Super", "Melee", "Grenade"),
    ("Spirit of Inmost Light", "Spirit of the Gyrfalcon"): ("Super", "Melee", "Weapons"),
    ("Spirit of Inmost Light", "Spirit of the Liar"): ("Super", "Melee", "Health"),
    ("Spirit of Inmost Light", "Spirit of the Wormhusk"): ("Super", "Melee", "Class"),
    ("Spirit of Inmost Light", "Spirit of Alpha Lupi"): ("Super", "Melee", "Class"),
    ("Spirit of Inmost Light", "Spirit of Contact"): ("Super", "Melee", "Grenade"),
    ("Spirit of Inmost Light", "Spirit of Scars"): ("Super", "Melee", "Health"),
    ("Spirit of Inmost Light", "Spirit of the Armamentarium"): ("Super", "Melee", "Grenade"),
    ("Spirit of Inmost Light", "Spirit of the Horn"): ("Super", "Melee", "Class"),
    ("Spirit of Inmost Light", "Spirit of Harmony"): ("Super", "Melee", "Weapons"),
    ("Spirit of Inmost Light", "Spirit of Starfire"): ("Super", "Melee", "Grenade"),
    ("Spirit of Inmost Light", "Spirit of the Claw"): ("Super", "Melee", "Health"),
    ("Spirit of Inmost Light", "Spirit of the Swarm"): ("Super", "Melee", "Grenade"),
    ("Spirit of Inmost Light", "Spirit of Vesper"): ("Super", "Melee", "Class"),

    # Spirit of the Ophidian (Gunner)
    ("Spirit of the Ophidian", "Spirit of the Star-Eater"): ("Weapons", "Grenade", "Super"),
    ("Spirit of the Ophidian", "Spirit of Synthoceps"): ("Weapons", "Grenade", "Melee"),
    ("Spirit of the Ophidian", "Spirit of Verity"): ("Weapons", "Grenade", "Melee"),
    ("Spirit of the Ophidian", "Spirit of the Coyote"): ("Weapons", "Grenade", "Class"),
    ("Spirit of the Ophidian", "Spirit of Cyrtarachne"): ("Weapons", "Grenade", "Health"),
    ("Spirit of the Ophidian", "Spirit of the Gyrfalcon"): ("Weapons", "Grenade", "Melee"),
    ("Spirit of the Ophidian", "Spirit of the Liar"): ("Weapons", "Grenade", "Melee"),
    ("Spirit of the Ophidian", "Spirit of the Wormhusk"): ("Weapons", "Grenade", "Class"),
    ("Spirit of the Ophidian", "Spirit of Alpha Lupi"): ("Weapons", "Grenade", "Class"),
    ("Spirit of the Ophidian", "Spirit of Contact"): ("Weapons", "Grenade", "Melee"),
    ("Spirit of the Ophidian", "Spirit of Scars"): ("Weapons", "Grenade", "Health"),
    ("Spirit of the Ophidian", "Spirit of the Armamentarium"): ("Weapons", "Grenade", "Super"),
    ("Spirit of the Ophidian", "Spirit of the Horn"): ("Weapons", "Grenade", "Class"),
    ("Spirit of the Ophidian", "Spirit of Harmony"): ("Weapons", "Grenade", "Super"),
    ("Spirit of the Ophidian", "Spirit of Starfire"): ("Weapons", "Grenade", "Super"),
    ("Spirit of the Ophidian", "Spirit of the Claw"): ("Weapons", "Grenade", "Melee"),
    ("Spirit of the Ophidian", "Spirit of the Swarm"): ("Weapons", "Grenade", "Melee"),
    ("Spirit of the Ophidian", "Spirit of Vesper"): ("Weapons", "Grenade", "Class"),

    # === Hunter-exclusive left perks ===

    # Spirit of Caliban (Brawler)
    ("Spirit of Caliban", "Spirit of the Star-Eater"): ("Melee", "Health", "Super"),
    ("Spirit of Caliban", "Spirit of Synthoceps"): ("Melee", "Health", "Class"),
    ("Spirit of Caliban", "Spirit of Verity"): ("Melee", "Health", "Grenade"),
    ("Spirit of Caliban", "Spirit of the Coyote"): ("Melee", "Health", "Class"),
    ("Spirit of Caliban", "Spirit of Cyrtarachne"): ("Melee", "Health", "Grenade"),
    ("Spirit of Caliban", "Spirit of the Gyrfalcon"): ("Melee", "Health", "Weapons"),
    ("Spirit of Caliban", "Spirit of the Liar"): ("Melee", "Health", "Class"),
    ("Spirit of Caliban", "Spirit of the Wormhusk"): ("Melee", "Health", "Class"),

    # Spirit of Galanor (Paragon)
    ("Spirit of Galanor", "Spirit of the Star-Eater"): ("Super", "Melee", "Weapons"),
    ("Spirit of Galanor", "Spirit of Synthoceps"): ("Super", "Melee", "Health"),
    ("Spirit of Galanor", "Spirit of Verity"): ("Super", "Melee", "Grenade"),
    ("Spirit of Galanor", "Spirit of the Coyote"): ("Super", "Melee", "Class"),
    ("Spirit of Galanor", "Spirit of Cyrtarachne"): ("Super", "Melee", "Grenade"),
    ("Spirit of Galanor", "Spirit of the Gyrfalcon"): ("Super", "Melee", "Weapons"),
    ("Spirit of Galanor", "Spirit of the Liar"): ("Super", "Melee", "Health"),
    ("Spirit of Galanor", "Spirit of the Wormhusk"): ("Super", "Melee", "Class"),

    # Spirit of Renewal (Grenadier)
    ("Spirit of Renewal", "Spirit of the Star-Eater"): ("Grenade", "Super", "Weapons"),
    ("Spirit of Renewal", "Spirit of Synthoceps"): ("Grenade", "Super", "Melee"),
    ("Spirit of Renewal", "Spirit of Verity"): ("Grenade", "Super", "Melee"),
    ("Spirit of Renewal", "Spirit of the Coyote"): ("Grenade", "Super", "Class"),
    ("Spirit of Renewal", "Spirit of Cyrtarachne"): ("Grenade", "Super", "Health"),
    ("Spirit of Renewal", "Spirit of the Gyrfalcon"): ("Grenade", "Super", "Weapons"),
    ("Spirit of Renewal", "Spirit of the Liar"): ("Grenade", "Super", "Melee"),
    ("Spirit of Renewal", "Spirit of the Wormhusk"): ("Grenade", "Super", "Class"),

    # Spirit of the Dragon (Specialist)
    ("Spirit of the Dragon", "Spirit of the Star-Eater"): ("Class", "Weapons", "Super"),
    ("Spirit of the Dragon", "Spirit of Synthoceps"): ("Class", "Weapons", "Melee"),
    ("Spirit of the Dragon", "Spirit of Verity"): ("Class", "Weapons", "Grenade"),
    ("Spirit of the Dragon", "Spirit of the Coyote"): ("Class", "Weapons", "Melee"),
    ("Spirit of the Dragon", "Spirit of Cyrtarachne"): ("Class", "Weapons", "Grenade"),
    ("Spirit of the Dragon", "Spirit of the Gyrfalcon"): ("Class", "Weapons", "Melee"),
    ("Spirit of the Dragon", "Spirit of the Liar"): ("Class", "Weapons", "Melee"),
    ("Spirit of the Dragon", "Spirit of the Wormhusk"): ("Class", "Weapons", "Health"),

    # Spirit of the Foe Tracer (Gunner)
    ("Spirit of the Foe Tracer", "Spirit of the Star-Eater"): ("Weapons", "Grenade", "Super"),
    ("Spirit of the Foe Tracer", "Spirit of Synthoceps"): ("Weapons", "Grenade", "Melee"),
    ("Spirit of the Foe Tracer", "Spirit of Verity"): ("Weapons", "Grenade", "Melee"),
    ("Spirit of the Foe Tracer", "Spirit of the Coyote"): ("Weapons", "Grenade", "Class"),
    ("Spirit of the Foe Tracer", "Spirit of Cyrtarachne"): ("Weapons", "Grenade", "Health"),
    ("Spirit of the Foe Tracer", "Spirit of the Gyrfalcon"): ("Weapons", "Grenade", "Melee"),
    ("Spirit of the Foe Tracer", "Spirit of the Liar"): ("Weapons", "Grenade", "Melee"),
    ("Spirit of the Foe Tracer", "Spirit of the Wormhusk"): ("Weapons", "Grenade", "Class"),

    # === Titan-exclusive left perks ===

    # Spirit of Hoarfrost (Specialist)
    ("Spirit of Hoarfrost", "Spirit of the Star-Eater"): ("Class", "Weapons", "Super"),
    ("Spirit of Hoarfrost", "Spirit of Synthoceps"): ("Class", "Weapons", "Melee"),
    ("Spirit of Hoarfrost", "Spirit of Verity"): ("Class", "Weapons", "Grenade"),
    ("Spirit of Hoarfrost", "Spirit of Alpha Lupi"): ("Class", "Weapons", "Health"),
    ("Spirit of Hoarfrost", "Spirit of Contact"): ("Class", "Weapons", "Melee"),
    ("Spirit of Hoarfrost", "Spirit of Scars"): ("Class", "Weapons", "Health"),
    ("Spirit of Hoarfrost", "Spirit of the Armamentarium"): ("Class", "Weapons", "Grenade"),
    ("Spirit of Hoarfrost", "Spirit of the Horn"): ("Class", "Weapons", "Grenade"),

    # Spirit of Severance (Brawler)
    ("Spirit of Severance", "Spirit of the Star-Eater"): ("Melee", "Health", "Super"),
    ("Spirit of Severance", "Spirit of Synthoceps"): ("Melee", "Health", "Class"),
    ("Spirit of Severance", "Spirit of Verity"): ("Melee", "Health", "Grenade"),
    ("Spirit of Severance", "Spirit of Alpha Lupi"): ("Melee", "Health", "Class"),
    ("Spirit of Severance", "Spirit of Contact"): ("Melee", "Health", "Grenade"),
    ("Spirit of Severance", "Spirit of Scars"): ("Melee", "Health", "Weapons"),
    ("Spirit of Severance", "Spirit of the Armamentarium"): ("Melee", "Health", "Grenade"),
    ("Spirit of Severance", "Spirit of the Horn"): ("Melee", "Health", "Class"),

    # Spirit of the Abeyant (Specialist)
    ("Spirit of the Abeyant", "Spirit of the Star-Eater"): ("Class", "Weapons", "Super"),
    ("Spirit of the Abeyant", "Spirit of Synthoceps"): ("Class", "Weapons", "Melee"),
    ("Spirit of the Abeyant", "Spirit of Verity"): ("Class", "Weapons", "Grenade"),
    ("Spirit of the Abeyant", "Spirit of Alpha Lupi"): ("Class", "Weapons", "Health"),
    ("Spirit of the Abeyant", "Spirit of Contact"): ("Class", "Weapons", "Melee"),
    ("Spirit of the Abeyant", "Spirit of Scars"): ("Class", "Weapons", "Health"),
    ("Spirit of the Abeyant", "Spirit of the Armamentarium"): ("Class", "Weapons", "Grenade"),
    ("Spirit of the Abeyant", "Spirit of the Horn"): ("Class", "Weapons", "Grenade"),

    # Spirit of the Bear (Grenadier)
    ("Spirit of the Bear", "Spirit of the Star-Eater"): ("Grenade", "Super", "Weapons"),
    ("Spirit of the Bear", "Spirit of Synthoceps"): ("Grenade", "Super", "Melee"),
    ("Spirit of the Bear", "Spirit of Verity"): ("Grenade", "Super", "Melee"),
    ("Spirit of the Bear", "Spirit of Alpha Lupi"): ("Grenade", "Super", "Class"),
    ("Spirit of the Bear", "Spirit of Contact"): ("Grenade", "Super", "Melee"),
    ("Spirit of the Bear", "Spirit of Scars"): ("Grenade", "Super", "Health"),
    ("Spirit of the Bear", "Spirit of the Armamentarium"): ("Grenade", "Super", "Weapons"),
    ("Spirit of the Bear", "Spirit of the Horn"): ("Grenade", "Super", "Class"),

    # Spirit of the Eternal Warrior (Paragon)
    ("Spirit of the Eternal Warrior", "Spirit of the Star-Eater"): ("Super", "Melee", "Weapons"),
    ("Spirit of the Eternal Warrior", "Spirit of Synthoceps"): ("Super", "Melee", "Health"),
    ("Spirit of the Eternal Warrior", "Spirit of Verity"): ("Super", "Melee", "Grenade"),
    ("Spirit of the Eternal Warrior", "Spirit of Alpha Lupi"): ("Super", "Melee", "Class"),
    ("Spirit of the Eternal Warrior", "Spirit of Contact"): ("Super", "Melee", "Grenade"),
    ("Spirit of the Eternal Warrior", "Spirit of Scars"): ("Super", "Melee", "Health"),
    ("Spirit of the Eternal Warrior", "Spirit of the Armamentarium"): ("Super", "Melee", "Grenade"),
    ("Spirit of the Eternal Warrior", "Spirit of the Horn"): ("Super", "Melee", "Class"),

    # === Warlock-exclusive left perks ===

    # Spirit of Apotheosis (Paragon)
    ("Spirit of Apotheosis", "Spirit of the Star-Eater"): ("Super", "Melee", "Weapons"),
    ("Spirit of Apotheosis", "Spirit of Synthoceps"): ("Super", "Melee", "Health"),
    ("Spirit of Apotheosis", "Spirit of Verity"): ("Super", "Melee", "Grenade"),
    ("Spirit of Apotheosis", "Spirit of Harmony"): ("Super", "Melee", "Weapons"),
    ("Spirit of Apotheosis", "Spirit of Starfire"): ("Super", "Melee", "Grenade"),
    ("Spirit of Apotheosis", "Spirit of the Claw"): ("Super", "Melee", "Health"),
    ("Spirit of Apotheosis", "Spirit of the Swarm"): ("Super", "Melee", "Grenade"),
    ("Spirit of Apotheosis", "Spirit of Vesper"): ("Super", "Melee", "Class"),

    # Spirit of Osmiomancy (Grenadier)
    ("Spirit of Osmiomancy", "Spirit of the Star-Eater"): ("Grenade", "Super", "Weapons"),
    ("Spirit of Osmiomancy", "Spirit of Synthoceps"): ("Grenade", "Super", "Melee"),
    ("Spirit of Osmiomancy", "Spirit of Verity"): ("Grenade", "Super", "Melee"),
    ("Spirit of Osmiomancy", "Spirit of Harmony"): ("Grenade", "Super", "Weapons"),
    ("Spirit of Osmiomancy", "Spirit of Starfire"): ("Grenade", "Super", "Weapons"),
    ("Spirit of Osmiomancy", "Spirit of the Claw"): ("Grenade", "Super", "Melee"),
    ("Spirit of Osmiomancy", "Spirit of the Swarm"): ("Grenade", "Super", "Melee"),
    ("Spirit of Osmiomancy", "Spirit of Vesper"): ("Grenade", "Super", "Class"),

    # Spirit of the Stag (Bulwark)
    ("Spirit of the Stag", "Spirit of the Star-Eater"): ("Health", "Class", "Super"),
    ("Spirit of the Stag", "Spirit of Synthoceps"): ("Health", "Class", "Melee"),
    ("Spirit of the Stag", "Spirit of Verity"): ("Health", "Class", "Grenade"),
    ("Spirit of the Stag", "Spirit of Harmony"): ("Health", "Class", "Weapons"),
    ("Spirit of the Stag", "Spirit of Starfire"): ("Health", "Class", "Grenade"),
    ("Spirit of the Stag", "Spirit of the Claw"): ("Health", "Class", "Melee"),
    ("Spirit of the Stag", "Spirit of the Swarm"): ("Health", "Class", "Grenade"),
    ("Spirit of the Stag", "Spirit of Vesper"): ("Health", "Class", "Weapons"),

    # Spirit of the Filaments (Specialist)
    ("Spirit of the Filaments", "Spirit of the Star-Eater"): ("Class", "Weapons", "Super"),
    ("Spirit of the Filaments", "Spirit of Synthoceps"): ("Class", "Weapons", "Melee"),
    ("Spirit of the Filaments", "Spirit of Verity"): ("Class", "Weapons", "Grenade"),
    ("Spirit of the Filaments", "Spirit of Harmony"): ("Class", "Weapons", "Super"),
    ("Spirit of the Filaments", "Spirit of Starfire"): ("Class", "Weapons", "Grenade"),
    ("Spirit of the Filaments", "Spirit of the Claw"): ("Class", "Weapons", "Melee"),
    ("Spirit of the Filaments", "Spirit of the Swarm"): ("Class", "Weapons", "Grenade"),
    ("Spirit of the Filaments", "Spirit of Vesper"): ("Class", "Weapons", "Health"),

    # Spirit of the Necrotic (Brawler)
    ("Spirit of the Necrotic", "Spirit of the Star-Eater"): ("Melee", "Health", "Super"),
    ("Spirit of the Necrotic", "Spirit of Synthoceps"): ("Melee", "Health", "Class"),
    ("Spirit of the Necrotic", "Spirit of Verity"): ("Melee", "Health", "Grenade"),
    ("Spirit of the Necrotic", "Spirit of Harmony"): ("Melee", "Health", "Weapons"),
    ("Spirit of the Necrotic", "Spirit of Starfire"): ("Melee", "Health", "Grenade"),
    ("Spirit of the Necrotic", "Spirit of the Claw"): ("Melee", "Health", "Class"),
    ("Spirit of the Necrotic", "Spirit of the Swarm"): ("Melee", "Health", "Grenade"),
    ("Spirit of the Necrotic", "Spirit of Vesper"): ("Melee", "Health", "Class"),
}
