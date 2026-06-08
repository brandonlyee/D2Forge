// Subclass fragment data.
//
// Fragments are subclass mods that, in addition to their buildcrafting effects, shift a
// player's *baseline* stats by a fixed amount (+10 / -10 / -20 to one or two stats). Selecting
// fragments raises (or lowers) the starting stat floor the armor optimizer has to build on top
// of, which in turn shifts the maximum achievable total. Only fragments from a single subclass
// can be equipped at once.
//
// `effects` is a per-stat delta. `icon` is the Bungie.net icon URL (may be empty if unknown;
// the UI falls back to a generic glyph).

import type { StatName } from "@/lib/constants"

export type FragmentEffect = Partial<Record<StatName, number>>

export interface Fragment {
  name: string
  effects: FragmentEffect
  icon: string
}

export interface Subclass {
  id: string
  name: string
  // CSS color token used to accent the subclass in the UI.
  accent: string
  fragments: Fragment[]
}

export const SUBCLASSES: Subclass[] = [
  {
    id: "arc",
    name: "Arc",
    accent: "#7AE7F6",
    fragments: [
      { name: "Spark of Brilliance", effects: { Super: 10 }, icon: "https://www.bungie.net/common/destiny2_content/icons/d38a4297cfe3ec89427f68ef92b076e5.jpg" },
      { name: "Spark of Discharge", effects: { Melee: -10 }, icon: "https://www.bungie.net/common/destiny2_content/icons/c883bf91f42e9c4b9c9ddce1ba2d2de5.jpg" },
      { name: "Spark of Feedback", effects: { Health: 10 }, icon: "https://www.bungie.net/common/destiny2_content/icons/58a935c2948d5f20d060bc87a0ad25d2.jpg" },
      { name: "Spark of Focus", effects: { Health: -10 }, icon: "https://www.bungie.net/common/destiny2_content/icons/cfcdcc8f7d07111f6079ad8f869273c6.jpg" },
      { name: "Spark of Resistance", effects: { Melee: 10 }, icon: "https://www.bungie.net/common/destiny2_content/icons/d92e1a6770ebbb509ceda1c6ab545e43.jpg" },
      { name: "Spark of Shock", effects: { Grenade: -10 }, icon: "https://www.bungie.net/common/destiny2_content/icons/2f49889b1fe7bcf01ef12b2cdc0fb511.jpg" },
      { name: "Spark of Volts", effects: { Class: 10 }, icon: "https://www.bungie.net/common/destiny2_content/icons/bb6175746eecf3160a591efe343a3fdf.jpg" },
    ],
  },
  {
    id: "solar",
    name: "Solar",
    accent: "#F0A04B",
    fragments: [
      { name: "Ember of Beams", effects: { Super: 10 }, icon: "https://www.bungie.net/common/destiny2_content/icons/2f12ba3df56de7c0e2790f481cb29a52.jpg" },
      { name: "Ember of Benevolence", effects: { Grenade: -10 }, icon: "https://www.bungie.net/common/destiny2_content/icons/0b5cf537c6ad5d80cbdd3675d0e7134d.jpg" },
      { name: "Ember of Char", effects: { Grenade: 10 }, icon: "https://www.bungie.net/common/destiny2_content/icons/a299dde35bfcd830923458846d7a64f3.jpg" },
      { name: "Ember of Combustion", effects: { Melee: 10 }, icon: "https://www.bungie.net/common/destiny2_content/icons/45476d85d0e6aeded810f217a0627afb.jpg" },
      { name: "Ember of Empyrean", effects: { Health: -10 }, icon: "https://www.bungie.net/common/destiny2_content/icons/be99d52c12f9359fc948b4563f74e712.jpg" },
      { name: "Ember of Eruption", effects: { Melee: 10 }, icon: "https://www.bungie.net/common/destiny2_content/icons/8734774377b5e73a84ed045a78ce232c.jpg" },
      { name: "Ember of Mercy", effects: { Health: 10 }, icon: "https://www.bungie.net/common/destiny2_content/icons/5ca8c8de03f981b9c984a1f2bdea0f61.jpg" },
      { name: "Ember of Searing", effects: { Class: 10 }, icon: "https://www.bungie.net/common/destiny2_content/icons/7312346d93dc0e84d46e539a10aebb52.jpg" },
      { name: "Ember of Tempering", effects: { Class: -10 }, icon: "https://www.bungie.net/common/destiny2_content/icons/cddc93648f0917dc8bd6663d38d7c379.jpg" },
      { name: "Ember of Torches", effects: { Grenade: -10 }, icon: "https://www.bungie.net/common/destiny2_content/icons/1ef2e34dad0d52c762ed96e8c932dc38.jpg" },
      { name: "Ember of Wonder", effects: { Health: 10 }, icon: "https://www.bungie.net/common/destiny2_content/icons/9de7766c9c9b56b75bde1054e3eefb1a.jpg" },
    ],
  },
  {
    id: "void",
    name: "Void",
    accent: "#B185DB",
    fragments: [
      { name: "Echo of Dilation", effects: { Super: 10, Weapons: 10 }, icon: "https://www.bungie.net/common/destiny2_content/icons/029faa3dc0d82eefef581dec7820d643.jpg" },
      { name: "Echo of Domineering", effects: { Grenade: 10 }, icon: "https://www.bungie.net/common/destiny2_content/icons/958ff340ae4ce16d7cf71c5268a13919.jpg" },
      { name: "Echo of Exchange", effects: { Melee: 10 }, icon: "https://www.bungie.net/common/destiny2_content/icons/e5a6ac0f38df212a40dc541bb46f354f.jpg" },
      { name: "Echo of Expulsion", effects: { Super: 10 }, icon: "https://www.bungie.net/common/destiny2_content/icons/d6500235bb175f0fc3752cab0a170fd2.jpg" },
      { name: "Echo of Instability", effects: { Melee: 10 }, icon: "https://www.bungie.net/common/destiny2_content/icons/0ad46f9c0c14535c4d5776daf48e871e.jpg" },
      { name: "Echo of Leeching", effects: { Health: 10 }, icon: "https://www.bungie.net/common/destiny2_content/icons/6aa22ca5ba309f264af5231969ec840a.jpg" },
      { name: "Echo of Obscurity", effects: { Class: 10 }, icon: "https://www.bungie.net/common/destiny2_content/icons/7d711ce4bcfb264da29c289ff70b9876.jpg" },
      { name: "Echo of Persistence", effects: { Health: -10 }, icon: "https://www.bungie.net/common/destiny2_content/icons/914309029085289921f77d8207765150.jpg" },
      { name: "Echo of Provision", effects: { Grenade: 10 }, icon: "https://www.bungie.net/common/destiny2_content/icons/1c16b5205d6a648b9898cce6ac3a01b3.jpg" },
      { name: "Echo of Starvation", effects: { Class: -10 }, icon: "https://www.bungie.net/common/destiny2_content/icons/19219ecd56fef82e9ead65aed8fea63a.jpg" },
      { name: "Echo of Undermining", effects: { Grenade: -10 }, icon: "https://www.bungie.net/common/destiny2_content/icons/b114e9d97c42a68b19ab7876a221b354.jpg" },
    ],
  },
  {
    id: "stasis",
    name: "Stasis",
    accent: "#6CA8F0",
    fragments: [
      { name: "Whisper of Bonds", effects: { Super: -10 }, icon: "https://www.bungie.net/common/destiny2_content/icons/12b591b2720cc265d800e870484f6d5b.png" },
      { name: "Whisper of Chains", effects: { Class: 10 }, icon: "https://www.bungie.net/common/destiny2_content/icons/d764e09a79be71fb5d37e612e610cf18.png" },
      { name: "Whisper of Conduction", effects: { Health: 10, Super: 10 }, icon: "https://www.bungie.net/common/destiny2_content/icons/2d84a595d269762c434718e34d2e7d78.png" },
      { name: "Whisper of Durance", effects: { Melee: 10 }, icon: "https://www.bungie.net/common/destiny2_content/icons/263713a8639fb73350c13b5b520fefa2.png" },
      { name: "Whisper of Fractures", effects: { Grenade: -10 }, icon: "https://www.bungie.net/common/destiny2_content/icons/a28274406a8a0e7ec916a33ec830ba6f.png" },
      { name: "Whisper of Hunger", effects: { Melee: -20 }, icon: "https://www.bungie.net/common/destiny2_content/icons/549368f903ac85dc177a56555ce69ae7.png" },
      { name: "Whisper of Impetus", effects: { Health: 10 }, icon: "https://www.bungie.net/common/destiny2_content/icons/710c5e3aec26f0e3e468c656a2669e0d.png" },
      { name: "Whisper of Torment", effects: { Grenade: -10 }, icon: "https://www.bungie.net/common/destiny2_content/icons/0f69591331f4def8ab2a4bb27c55b2aa.png" },
    ],
  },
  {
    id: "strand",
    name: "Strand",
    accent: "#52D17F",
    fragments: [
      { name: "Thread of Ascent", effects: { Weapons: 10 }, icon: "https://www.bungie.net/common/destiny2_content/icons/25e7ef19cf989641771175e05bcfb3c2.jpg" },
      { name: "Thread of Binding", effects: { Health: 10 }, icon: "https://www.bungie.net/common/destiny2_content/icons/73a3a289acb7b91ee236d9d9a9bdee1b.jpg" },
      { name: "Thread of Evolution", effects: { Super: 10 }, icon: "https://www.bungie.net/common/destiny2_content/icons/c86847f148a9e86459dac50ba36da591.jpg" },
      { name: "Thread of Finality", effects: { Class: 10 }, icon: "https://www.bungie.net/common/destiny2_content/icons/1e61bee1b4607fea83a6d3d01dfb8bce.jpg" },
      { name: "Thread of Fury", effects: { Melee: -10 }, icon: "https://www.bungie.net/common/destiny2_content/icons/0e8b8974d2f17e25c085703bef8a3b53.jpg" },
      { name: "Thread of Generation", effects: { Grenade: -10 }, icon: "https://www.bungie.net/common/destiny2_content/icons/8cceec23c83bbbf576bd0b7eba18abe4.jpg" },
      { name: "Thread of Propagation", effects: { Melee: 10 }, icon: "https://www.bungie.net/common/destiny2_content/icons/d42d64ff749d858b6c72c5dc4b775797.jpg" },
      { name: "Thread of Transmutation", effects: { Melee: 10 }, icon: "https://www.bungie.net/common/destiny2_content/icons/d80a220ddab3e3be2641517ad3049915.jpg" },
      { name: "Thread of Warding", effects: { Health: -10 }, icon: "https://www.bungie.net/common/destiny2_content/icons/9937046794352b7c7ce31340ac7832ba.jpg" },
    ],
  },
  {
    id: "prismatic",
    name: "Prismatic",
    accent: "#D98FD0",
    fragments: [
      { name: "Facet of Awakening", effects: { Health: 10 }, icon: "https://www.bungie.net/common/destiny2_content/icons/4b95e3952707f0da2be11f0a68de1f3b.png" },
      { name: "Facet of Courage", effects: { Grenade: 10 }, icon: "https://www.bungie.net/common/destiny2_content/icons/536765c9ed5e2f53268859591e8e9acf.png" },
      { name: "Facet of Dawn", effects: { Melee: -10 }, icon: "https://www.bungie.net/common/destiny2_content/icons/684547ed1f97efdca37df4f1a5c5e699.png" },
      { name: "Facet of Defiance", effects: { Class: 10 }, icon: "https://www.bungie.net/common/destiny2_content/icons/ee2901d9887ebf717331ee90bca2409b.png" },
      { name: "Facet of Devotion", effects: { Melee: 10 }, icon: "https://www.bungie.net/common/destiny2_content/icons/923682dba15fcb9685f195d25eff1b95.png" },
      { name: "Facet of Dominance", effects: { Grenade: -10 }, icon: "https://www.bungie.net/common/destiny2_content/icons/9a8bc8a614afe98844541df966a2c274.png" },
      { name: "Facet of Grace", effects: { Health: -10 }, icon: "https://www.bungie.net/common/destiny2_content/icons/8cd933c465613a7bedb9b208c362cc85.png" },
      { name: "Facet of Honor", effects: { Melee: 10 }, icon: "https://www.bungie.net/common/destiny2_content/icons/0381dcb3720a7eba9d3a24c0101ddfa7.png" },
      { name: "Facet of Justice", effects: { Super: 10 }, icon: "https://www.bungie.net/common/destiny2_content/icons/a4ab50f95e50d0eec1303139ab23f3fd.png" },
      { name: "Facet of Protection", effects: { Melee: 10 }, icon: "https://www.bungie.net/common/destiny2_content/icons/b6d90ee669fc1fef2e22ff95188be313.png" },
      { name: "Facet of Purpose", effects: { Class: -10 }, icon: "https://www.bungie.net/common/destiny2_content/icons/7a6b1d98544eb4a8512c6be0b6486456.png" },
      { name: "Facet of Ruin", effects: { Weapons: 10 }, icon: "https://www.bungie.net/common/destiny2_content/icons/058a2677d6742227811e81d8c4354270.png" },
      { name: "Facet of Sacrifice", effects: { Grenade: 10 }, icon: "https://www.bungie.net/common/destiny2_content/icons/b1aec7c22fee7032b6a4898e3c9867ff.png" },
    ],
  },
]

// Quick lookups by subclass id and by fragment name (names are globally unique).
export const SUBCLASS_BY_ID: Record<string, Subclass> = Object.fromEntries(
  SUBCLASSES.map((s) => [s.id, s])
)

export const FRAGMENT_BY_NAME: Record<string, Fragment> = Object.fromEntries(
  SUBCLASSES.flatMap((s) => s.fragments.map((f) => [f.name, f]))
)

// A resolved snapshot of the fragments chosen for a run. Carried alongside the solutions and
// persisted into saved checklists so a saved build records which fragments it relies on.
export interface FragmentSelection {
  subclassId: string
  subclassName: string
  accent: string
  fragments: Fragment[]
}

// Build a FragmentSelection from the raw form fields, or null if fragments aren't in use /
// nothing is selected. Resolves names against the canonical fragment data.
export function buildFragmentSelection(
  subclassId: string | undefined,
  names: readonly string[]
): FragmentSelection | null {
  if (!subclassId) return null
  const sc = SUBCLASS_BY_ID[subclassId]
  if (!sc) return null
  const fragments = names.map((n) => FRAGMENT_BY_NAME[n]).filter(Boolean)
  if (fragments.length === 0) return null
  return { subclassId, subclassName: sc.name, accent: sc.accent, fragments }
}

// Sum the per-stat baseline shift contributed by a set of selected fragment names.
// Returns a full 6-stat record (zeros where untouched).
export function computeFragmentBonuses(
  selected: readonly string[]
): Record<StatName, number> {
  const bonuses: Record<StatName, number> = {
    Health: 0,
    Melee: 0,
    Grenade: 0,
    Super: 0,
    Class: 0,
    Weapons: 0,
  }
  for (const name of selected) {
    const frag = FRAGMENT_BY_NAME[name]
    if (!frag) continue
    for (const [stat, delta] of Object.entries(frag.effects)) {
      bonuses[stat as StatName] += delta as number
    }
  }
  return bonuses
}
