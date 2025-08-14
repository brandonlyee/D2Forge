"""
Exotic Class Item Perk Combinations

This file contains all known and potential exotic class item perk combinations.
Map format: (perk1, perk2) -> (primary_stat, secondary_stat, tertiary_stat)

Validated combinations are uncommented and actively used by the optimizer.
Commented combinations marked "# Guess, needs validation" are potential future additions
that require in-game verification of their stat distributions.
"""

CLASS_ITEM_ROLLS = {
    # Spirit of the Assassin Rolls
    ("Spirit of the Assassin", "Spirit of the Star-Eater"): ("Melee", "Health", "Super"),
    ("Spirit of the Assassin", "Spirit of Synthoceps"): ("Melee", "Health", "Class"),
    ("Spirit of the Assassin", "Spirit of Verity"): ("Melee", "Health", "Grenade"),
    # ("Spirit of the Assassin", "Spirit of Cyrtarachne"): ("Melee", "Health", "Grenade"),  # Guess, needs validation
    # ("Spirit of the Assassin", "Spirit of the Gyrfalcon"): ("Melee", "Health", "Weapons"),  # Guess, needs validation
    # ("Spirit of the Assassin", "Spirit of the Liar"): ("Melee", "Health", "Class"),  # Guess, needs validation
    # ("Spirit of the Assassin", "Spirit of the Wormhusk"): ("Melee", "Health", "Class"),  # Guess, needs validation
    # ("Spirit of the Assassin", "Spirit of the Coyote"): ("Melee", "Health", "Class"),  # Guess, needs validation
    # ("Spirit of the Assassin", "Spirit of Contact"): ("Melee", "Health", "Class"),  # Guess, needs validation
    # ("Spirit of the Assassin", "Spirit of Scars"): ("Melee", "Health", "Class"),  # Guess, needs validation
    # ("Spirit of the Assassin", "Spirit of the Horn"): ("Melee", "Health", "Class"),  # Guess, needs validation
    # ("Spirit of the Assassin", "Spirit of the Alpha Lupi"): ("Melee", "Health", "Class"),  # Guess, needs validation
    # ("Spirit of the Assassin", "Spirit of the Armamentarium"): ("Melee", "Health", "Grenade"),  # Guess, needs validation
    # ("Spirit of the Assassin", "Spirit of the Vesper"): ("Melee", "Health", "Class"),  # Guess, needs validation
    # ("Spirit of the Assassin", "Spirit of the Harmony"): ("Melee", "Health", "Weapons"),  # Guess, needs validation
    # ("Spirit of the Assassin", "Spirit of the Swarm"): ("Melee", "Health", "Grenade"),  # Guess, needs validation
    # ("Spirit of the Assassin", "Spirit of the Claw"): ("Melee", "Health", "Class"),  # Guess, needs validation

    # Spirit of Inmost Light Rolls
    ("Spirit of Inmost Light", "Spirit of the Star-Eater"): ("Super", "Melee", "Weapons"),
    ("Spirit of Inmost Light", "Spirit of Synthoceps"): ("Super", "Melee", "Health"),
    ("Spirit of Inmost Light", "Spirit of Verity"): ("Super", "Melee", "Grenade"),
    ("Spirit of Inmost Light", "Spirit of Cyrtarachne"): ("Super", "Melee", "Grenade"),
    ("Spirit of Inmost Light", "Spirit of the Gyrfalcon"): ("Super", "Melee", "Weapons"),
    # ("Spirit of Inmost Light", "Spirit of the Liar"): ("Super", "Melee", "Class"),  # Guess, needs validation
    ("Spirit of Inmost Light", "Spirit of the Wormhusk"): ("Super", "Melee", "Class"),
    ("Spirit of Inmost Light", "Spirit of the Coyote"): ("Super", "Melee", "Class"),
    # ("Spirit of Inmost Light", "Spirit of Contact"): ("Super", "Melee", "Class"),  # Guess, needs validation
    # ("Spirit of Inmost Light", "Spirit of Scars"): ("Super", "Melee", "Weapons"),  # Guess, needs validation
    # ("Spirit of Inmost Light", "Spirit of the Horn"): ("Super", "Melee", "Class"),  # Guess, needs validation
    # ("Spirit of Inmost Light", "Spirit of Alpha Lupi"): ("Super", "Melee", "Class"),  # Guess, needs validation
    # ("Spirit of Inmost Light", "Spirit of the Armamentarium"): ("Super", "Melee", "Grenade"),  # Guess, needs validation
    # ("Spirit of Inmost Light", "Spirit of Vesper"): ("Super", "Melee", "Class"),  # Guess, needs validation
    # ("Spirit of Inmost Light", "Spirit of Harmony"): ("Super", "Melee", "Weapons"),  # Guess, needs validation
    # ("Spirit of Inmost Light", "Spirit of the Swarm"): ("Super", "Melee", "Grenade"),  # Guess, needs validation
    # ("Spirit of Inmost Light", "Spirit of the Claw"): ("Super", "Melee", "Class"),  # Guess, needs validation

    # Spirit of the Ophidian Rolls
    # ("Spirit of the Ophidian", "Spirit of the Star-Eater"): ("Weapons", "Grenade", "Super"),  # Guess, needs validation
    # ("Spirit of the Ophidian", "Spirit of Synthoceps"): ("Weapons", "Grenade", "Melee"),  # Guess, needs validation
    # ("Spirit of the Ophidian", "Spirit of Verity"): ("Weapons", "Grenade", "Class"),  # Guess, needs validation
    # ("Spirit of the Ophidian", "Spirit of Cyrtarachne"): ("Weapons", "Grenade", "Class"),  # Guess, needs validation
    # ("Spirit of the Ophidian", "Spirit of the Gyrfalcon"): ("Weapons", "Grenade", "Class"),  # Guess, needs validation
    # ("Spirit of the Ophidian", "Spirit of the Liar"): ("Weapons", "Grenade", "Melee"),  # Guess, needs validation
    # ("Spirit of the Ophidian", "Spirit of the Wormhusk"): ("Weapons", "Grenade", "Class"),  # Guess, needs validation
    # ("Spirit of the Ophidian", "Spirit of the Coyote"): ("Weapons", "Grenade", "Class"),  # Guess, needs validation
    # ("Spirit of the Ophidian", "Spirit of Contact"): ("Weapons", "Grenade", "Melee"),  # Guess, needs validation
    # ("Spirit of the Ophidian", "Spirit of Scars"): ("Weapons", "Grenade", "Class"),  # Guess, needs validation
    # ("Spirit of the Ophidian", "Spirit of the Horn"): ("Weapons", "Grenade", "Class"),  # Guess, needs validation
    # ("Spirit of the Ophidian", "Spirit of Alpha Lupi"): ("Weapons", "Grenade", "Class"),  # Guess, needs validation
    # ("Spirit of the Ophidian", "Spirit of the Armamentarium"): ("Weapons", "Grenade", "Class"),  # Guess, needs validation
    # ("Spirit of the Ophidian", "Spirit of Vesper"): ("Weapons", "Grenade", "Class"),  # Guess, needs validation
    # ("Spirit of the Ophidian", "Spirit of Harmony"): ("Weapons", "Grenade", "Class"),  # Guess, needs validation
    # ("Spirit of the Ophidian", "Spirit of the Swarm"): ("Weapons", "Grenade", "Class"),  # Guess, needs validation
    # ("Spirit of the Ophidian", "Spirit of the Claw"): ("Weapons", "Grenade", "Melee"),  # Guess, needs validation

    # Spirit of the Dragon Rolls
    ("Spirit of the Dragon", "Spirit of the Star-Eater"): ("Class", "Weapons", "Super"),
    # ("Spirit of the Dragon", "Spirit of Synthoceps"): ("Class", "Weapons", "Health"),  # Guess, needs validation
    # ("Spirit of the Dragon", "Spirit of Verity"): ("Class", "Weapons", "Grenade"),  # Guess, needs validation
    # ("Spirit of the Dragon", "Spirit of Cyrtarachne"): ("Class", "Weapons", "Grenade"),  # Guess, needs validation
    # ("Spirit of the Dragon", "Spirit of the Gyrfalcon"): ("Class", "Weapons", "Weapons"),  # Guess, needs validation
    # ("Spirit of the Dragon", "Spirit of the Liar"): ("Class", "Weapons", "Class"),  # Guess, needs validation
    # ("Spirit of the Dragon", "Spirit of the Wormhusk"): ("Class", "Weapons", "Class"),  # Guess, needs validation
    ("Spirit of the Dragon", "Spirit of the Coyote"): ("Class", "Weapons", "Melee"),

    # Spirit of Galanor
    # ("Spirit of Galanor", "Spirit of the Star-Eater"): ("Super", "Melee", "Class"),  # Guess, needs validation
    # ("Spirit of Galanor", "Spirit of Synthoceps"): ("Super", "Melee", "Health"),  # Guess, needs validation
    # ("Spirit of Galanor", "Spirit of Verity"): ("Super", "Melee", "Grenade"),  # Guess, needs validation
    # ("Spirit of Galanor", "Spirit of Cyrtarachne"): ("Super", "Melee", "Grenade"),  # Guess, needs validation
    # ("Spirit of Galanor", "Spirit of the Gyrfalcon"): ("Super", "Melee", "Weapons"),  # Guess, needs validation
    # ("Spirit of Galanor", "Spirit of the Liar"): ("Super", "Melee", "Class"),  # Guess, needs validation
    # ("Spirit of Galanor", "Spirit of the Wormhusk"): ("Super", "Melee", "Class"),  # Guess, needs validation
    # ("Spirit of Galanor", "Spirit of the Coyote"): ("Super", "Melee", "Class"),  # Guess, needs validation

    # Spirit of the Foe Tracer
    ("Spirit of the Foe Tracer", "Spirit of the Star-Eater"): ("Weapons", "Grenade", "Super"),
    # ("Spirit of the Foe Tracer", "Spirit of Synthoceps"): ("Weapons", "Grenade", "Melee"),  # Guess, needs validation
    # ("Spirit of the Foe Tracer", "Spirit of Verity"): ("Weapons", "Grenade", "Class"),  # Guess, needs validation
    # ("Spirit of the Foe Tracer", "Spirit of Cyrtarachne"): ("Weapons", "Grenade", "Class"),  # Guess, needs validation
    # ("Spirit of the Foe Tracer", "Spirit of the Gyrfalcon"): ("Weapons", "Grenade", "Class"),  # Guess, needs validation
    # ("Spirit of the Foe Tracer", "Spirit of the Liar"): ("Weapons", "Grenade", "Melee"),  # Guess, needs validation
    # ("Spirit of the Foe Tracer", "Spirit of the Wormhusk"): ("Weapons", "Grenade", "Class"),  # Guess, needs validation
    # ("Spirit of the Foe Tracer", "Spirit of the Coyote"): ("Weapons", "Grenade", "Class"),  # Guess, needs validation

    # Spirit of Caliban
    # ("Spirit of Caliban", "Spirit of the Star-Eater"): ("Melee", "Health", "Super"),  # Guess, needs validation
    ("Spirit of Caliban", "Spirit of Synthoceps"): ("Melee", "Health", "Class"),
    # ("Spirit of Caliban", "Spirit of Verity"): ("Melee", "Health", "Grenade"),  # Guess, needs validation
    ("Spirit of Caliban", "Spirit of Cyrtarachne"): ("Melee", "Health", "Grenade"),
    # ("Spirit of Caliban", "Spirit of the Gyrfalcon"): ("Melee", "Health", "Weapons"),  # Guess, needs validation
    ("Spirit of Caliban", "Spirit of the Liar"): ("Melee", "Health", "Class"),
    # ("Spirit of Caliban", "Spirit of the Wormhusk"): ("Melee", "Health", "Class"),  # Guess, needs validation
    # ("Spirit of Caliban", "Spirit of the Coyote"): ("Melee", "Health", "Class"),  # Guess, needs validation

    # Spirit of Renewal
    # ("Spirit of Renewal", "Spirit of the Star-Eater"): ("Grenade", "Super", "Weapons"),  # Guess, needs validation
    # ("Spirit of Renewal", "Spirit of Synthoceps"): ("Grenade", "Super", "Melee"),  # Guess, needs validation
    # ("Spirit of Renewal", "Spirit of Verity"): ("Grenade", "Super", "Weapons"),  # Guess, needs validation
    ("Spirit of Renewal", "Spirit of Cyrtarachne"): ("Grenade", "Super", "Health"),
    # ("Spirit of Renewal", "Spirit of the Gyrfalcon"): ("Grenade", "Super", "Weapons"),  # Guess, needs validation
    # ("Spirit of Renewal", "Spirit of the Liar"): ("Grenade", "Super", "Class"),  # Guess, needs validation
    # ("Spirit of Renewal", "Spirit of the Wormhusk"): ("Grenade", "Super", "Class"),  # Guess, needs validation
    ("Spirit of Renewal", "Spirit of the Coyote"): ("Grenade", "Super", "Class"),

    # Spirit of Severance
    # ("Spirit of Severance", "Spirit of the Star-Eater"): ("Melee", "Health", "Super"),  # Guess, needs validation
    ("Spirit of Severance", "Spirit of Synthoceps"): ("Melee", "Health", "Class"),
    # ("Spirit of Severance", "Spirit of Verity"): ("Melee", "Health", "Grenade"),  # Guess, needs validation
    # ("Spirit of Severance", "Spirit of Contact"): ("Melee", "Health", "Grenade"),  # Guess, needs validation
    # ("Spirit of Severance", "Spirit of Scars"): ("Melee", "Health", "Class"),  # Guess, needs validation
    # ("Spirit of Severance", "Spirit of the Horn"): ("Melee", "Health", "Class"),  # Guess, needs validation
    # ("Spirit of Severance", "Spirit of Alpha Lupi"): ("Melee", "Health", "Class"),  # Guess, needs validation
    # ("Spirit of Severance", "Spirit of the Armamentarium"): ("Melee", "Health", "Grenade"),  # Guess, needs validation

    # Spirit of Hoarfrost
    # ("Spirit of Hoarfrost", "Spirit of the Star-Eater"): ("Melee", "Health", "Super"),  # Guess, needs validation
    # ("Spirit of Hoarfrost", "Spirit of Synthoceps"): ("Melee", "Health", "Class"),  # Guess, needs validation
    # ("Spirit of Hoarfrost", "Spirit of Verity"): ("Melee", "Health", "Grenade"),  # Guess, needs validation
    # ("Spirit of Hoarfrost", "Spirit of Contact"): ("Melee", "Health", "Grenade"),  # Guess, needs validation
    # ("Spirit of Hoarfrost", "Spirit of Scars"): ("Melee", "Health", "Class"),  # Guess, needs validation
    # ("Spirit of Hoarfrost", "Spirit of the Horn"): ("Melee", "Health", "Class"),  # Guess, needs validation
    # ("Spirit of Hoarfrost", "Spirit of Alpha Lupi"): ("Melee", "Health", "Class"),  # Guess, needs validation
    # ("Spirit of Hoarfrost", "Spirit of the Armamentarium"): ("Melee", "Health", "Grenade"),  # Guess, needs validation

    # Spirit of the Eternal Warrior
    ("Spirit of the Eternal Warrior", "Spirit of the Star-Eater"): ("Super", "Melee", "Weapons"),
    ("Spirit of the Eternal Warrior", "Spirit of Synthoceps"): ("Super", "Melee", "Health"),
    # ("Spirit of the Eternal Warrior", "Spirit of Verity"): ("Super", "Melee", "Grenade"),  # Guess, needs validation
    # ("Spirit of the Eternal Warrior", "Spirit of Contact"): ("Super", "Melee", "Grenade"),  # Guess, needs validation
    # ("Spirit of the Eternal Warrior", "Spirit of Scars"): ("Super", "Melee", "Class"),  # Guess, needs validation
    # ("Spirit of the Eternal Warrior", "Spirit of the Horn"): ("Super", "Melee", "Class"),  # Guess, needs validation
    # ("Spirit of the Eternal Warrior", "Spirit of Alpha Lupi"): ("Super", "Melee", "Class"),  # Guess, needs validation
    # ("Spirit of the Eternal Warrior", "Spirit of the Armamentarium"): ("Super", "Melee", "Grenade"),  # Guess, needs validation

    # Spirit of the Abeyant
    # ("Spirit of the Abeyant", "Spirit of the Star-Eater"): ("Class", "Weapons", "Super"),  # Guess, needs validation
    ("Spirit of the Abeyant", "Spirit of Synthoceps"): ("Class", "Weapons", "Melee"),
    # ("Spirit of the Abeyant", "Spirit of Verity"): ("Class", "Weapons", "Grenade"),  # Guess, needs validation
    # ("Spirit of the Abeyant", "Spirit of Contact"): ("Class", "Weapons", "Melee"),  # Guess, needs validation
    # ("Spirit of the Abeyant", "Spirit of Scars"): ("Class", "Weapons", "Weapons"),  # Guess, needs validation
    # ("Spirit of the Abeyant", "Spirit of the Horn"): ("Class", "Weapons", "Class"),  # Guess, needs validation
    # ("Spirit of the Abeyant", "Spirit of Alpha Lupi"): ("Class", "Weapons", "Class"),  # Guess, needs validation
    # ("Spirit of the Abeyant", "Spirit of the Armamentarium"): ("Class", "Weapons", "Grenade"),  # Guess, needs validation

    # Spirit of the Bear
    # ("Spirit of the Bear", "Spirit of the Star-Eater"): ("Grenade", "Super", "Class"),  # Guess, needs validation
    ("Spirit of the Bear", "Spirit of Synthoceps"): ("Grenade", "Super", "Melee"),
    # ("Spirit of the Bear", "Spirit of Verity"): ("Grenade", "Super", "Class"),  # Guess, needs validation
    # ("Spirit of the Bear", "Spirit of Contact"): ("Grenade", "Super", "Melee"),  # Guess, needs validation
    # ("Spirit of the Bear", "Spirit of Scars"): ("Grenade", "Super", "Weapons"),  # Guess, needs validation
    # ("Spirit of the Bear", "Spirit of the Horn"): ("Grenade", "Super", "Class"),  # Guess, needs validation
    # ("Spirit of the Bear", "Spirit of Alpha Lupi"): ("Grenade", "Super", "Class"),  # Guess, needs validation
    # ("Spirit of the Bear", "Spirit of the Armamentarium"): ("Grenade", "Super", "Class"),  # Guess, needs validation

    # Spirit of the Stag
    # ("Spirit of the Stag", "Spirit of the Star-Eater"): ("Health", "Class", "Super"),  # Guess, needs validation
    ("Spirit of the Stag", "Spirit of Synthoceps"): ("Health", "Class", "Melee"),
    # ("Spirit of the Stag", "Spirit of Verity"): ("Health", "Class", "Grenade"),  # Guess, needs validation
    # ("Spirit of the Stag", "Spirit of Vesper"): ("Health", "Class", "Weapons"),  # Guess, needs validation
    # ("Spirit of the Stag", "Spirit of Harmony"): ("Health", "Class", "Weapons"),  # Guess, needs validation
    # ("Spirit of the Stag", "Spirit of Starfire"): ("Health", "Class", "Grenade"),  # Guess, needs validation
    # ("Spirit of the Stag", "Spirit of the Swarm"): ("Health", "Class", "Grenade"),  # Guess, needs validation
    # ("Spirit of the Stag", "Spirit of the Claw"): ("Health", "Class", "Melee"),  # Guess, needs validation

    # Spirit of the Filaments
    # ("Spirit of the Filaments", "Spirit of the Star-Eater"): ("Class", "Weapons", "Super"),  # Guess, needs validation
    # ("Spirit of the Filaments", "Spirit of Synthoceps"): ("Class", "Weapons", "Melee"),  # Guess, needs validation
    # ("Spirit of the Filaments", "Spirit of Verity"): ("Class", "Weapons", "Grenade"),  # Guess, needs validation
    # ("Spirit of the Filaments", "Spirit of Vesper"): ("Class", "Weapons", "Grenade"),  # Guess, needs validation
    # ("Spirit of the Filaments", "Spirit of Harmony"): ("Class", "Weapons", "Super"),  # Guess, needs validation
    # ("Spirit of the Filaments", "Spirit of Starfire"): ("Class", "Weapons", "Grenade"),  # Guess, needs validation
    # ("Spirit of the Filaments", "Spirit of the Swarm"): ("Class", "Weapons", "Grenade"),  # Guess, needs validation
    # ("Spirit of the Filaments", "Spirit of the Claw"): ("Class", "Weapons", "Melee"),  # Guess, needs validation

    # Spirit of the Necrotic
    ("Spirit of the Necrotic", "Spirit of the Star-Eater"): ("Melee", "Health", "Super"),
    ("Spirit of the Necrotic", "Spirit of Synthoceps"): ("Melee", "Health", "Class"),
    # ("Spirit of the Necrotic", "Spirit of Verity"): ("Melee", "Health", "Grenade"),  # Guess, needs validation
    # ("Spirit of the Necrotic", "Spirit of Vesper"): ("Melee", "Health", "Grenade"),  # Guess, needs validation
    # ("Spirit of the Necrotic", "Spirit of Harmony"): ("Melee", "Health", "Super"),  # Guess, needs validation
    # ("Spirit of the Necrotic", "Spirit of Starfire"): ("Melee", "Health", "Grenade"),  # Guess, needs validation
    # ("Spirit of the Necrotic", "Spirit of the Swarm"): ("Melee", "Health", "Grenade"),  # Guess, needs validation
    # ("Spirit of the Necrotic", "Spirit of the Claw"): ("Melee", "Health", "Class"),  # Guess, needs validation

    # Spirit of Osmiomancy
    # ("Spirit of Osmiomancy", "Spirit of the Star-Eater"): ("Grenade", "Super", "Weapons"),
    # ("Spirit of Osmiomancy", "Spirit of Synthoceps"): ("Grenade", "Super", "Class"),
    ("Spirit of Osmiomancy", "Spirit of Verity"): ("Grenade", "Super", "Melee"),
    # ("Spirit of Osmiomancy", "Spirit of Vesper"): ("Grenade", "Super", "Class"),  # Guess, needs validation
    # ("Spirit of Osmiomancy", "Spirit of Harmony"): ("Grenade", "Super", "Weapons"),  # Guess, needs validation
    # ("Spirit of Osmiomancy", "Spirit of Starfire"): ("Grenade", "Super", "Weapons"),  # Guess, needs validation
    # ("Spirit of Osmiomancy", "Spirit of the Swarm"): ("Grenade", "Super", "Class"),  # Guess, needs validation
    # ("Spirit of Osmiomancy", "Spirit of the Claw"): ("Grenade", "Super", "Melee"),  # Guess, needs validation

    # Spirit of Apotheosis
    # ("Spirit of Apotheosis", "Spirit of the Star-Eater"): ("Super", "Melee", "Weapons"),  # Guess, needs validation
    ("Spirit of Apotheosis", "Spirit of Synthoceps"): ("Super", "Melee", "Health"),
    # ("Spirit of Apotheosis", "Spirit of Verity"): ("Super", "Melee", "Grenade"),  # Guess, needs validation
    # ("Spirit of Apotheosis", "Spirit of Vesper"): ("Super", "Melee", "Class"),  # Guess, needs validation
    # ("Spirit of Apotheosis", "Spirit of Harmony"): ("Super", "Melee", "Weapons"),  # Guess, needs validation
    # ("Spirit of Apotheosis", "Spirit of Starfire"): ("Super", "Melee", "Weapons"),  # Guess, needs validation
    # ("Spirit of Apotheosis", "Spirit of the Swarm"): ("Super", "Melee", "Class"),  # Guess, needs validation
    # ("Spirit of Apotheosis", "Spirit of the Claw"): ("Super", "Melee", "Class"),  # Guess, needs validation
}