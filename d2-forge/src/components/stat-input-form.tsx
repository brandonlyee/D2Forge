"use client"

import React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { StatIcon } from '@/components/stat-icon'
import { Icon } from '@/components/forge/icons'
import {
  ForgeSwitch,
  ForgeSlider,
  ForgeNumberField,
  ForgeSelect,
  ForgeTooltip,
  type ForgeSelectItem,
} from '@/components/forge/controls'
import { STAT_NAMES, MAX_POSSIBLE_TOTAL, STORAGE_KEYS } from '@/lib/constants'
import { readJSON, writeJSON } from '@/lib/storage'
import { SUBCLASSES, SUBCLASS_BY_ID, computeFragmentBonuses } from '@/lib/fragments'
import {
  ARCHETYPES,
  GEAR_SLOTS,
  GEAR_SLOT_LABEL,
  tertiaryOptions,
  isLockedPieceValid,
  sanitizeLockedPieces,
  type GearSlot,
  type LockedPiece,
  type LockedTuningMode,
} from '@/lib/archetypes'

const MAX_LOCKED_PIECES = 4

// Map each Perk 1 (left, archetype) to its valid Perk 2 (right, tertiary) options.
// Mirrors api/exotic_class_items.py CLASS_ITEM_ROLLS: class-agnostic left perks pair
// with every right perk; class-exclusive left perks pair only with class-agnostic or
// same-class right perks (class perks cannot be mixed across classes).
const EXOTIC_PERK_MAPPING = {
  "Spirit of the Assassin": ["Spirit of the Star-Eater", "Spirit of Synthoceps", "Spirit of Verity", "Spirit of the Coyote", "Spirit of Cyrtarachne", "Spirit of the Gyrfalcon", "Spirit of the Liar", "Spirit of the Wormhusk", "Spirit of Alpha Lupi", "Spirit of Contact", "Spirit of Scars", "Spirit of the Armamentarium", "Spirit of the Horn", "Spirit of Harmony", "Spirit of Starfire", "Spirit of the Claw", "Spirit of the Swarm", "Spirit of Vesper"],
  "Spirit of Inmost Light": ["Spirit of the Star-Eater", "Spirit of Synthoceps", "Spirit of Verity", "Spirit of the Coyote", "Spirit of Cyrtarachne", "Spirit of the Gyrfalcon", "Spirit of the Liar", "Spirit of the Wormhusk", "Spirit of Alpha Lupi", "Spirit of Contact", "Spirit of Scars", "Spirit of the Armamentarium", "Spirit of the Horn", "Spirit of Harmony", "Spirit of Starfire", "Spirit of the Claw", "Spirit of the Swarm", "Spirit of Vesper"],
  "Spirit of the Ophidian": ["Spirit of the Star-Eater", "Spirit of Synthoceps", "Spirit of Verity", "Spirit of the Coyote", "Spirit of Cyrtarachne", "Spirit of the Gyrfalcon", "Spirit of the Liar", "Spirit of the Wormhusk", "Spirit of Alpha Lupi", "Spirit of Contact", "Spirit of Scars", "Spirit of the Armamentarium", "Spirit of the Horn", "Spirit of Harmony", "Spirit of Starfire", "Spirit of the Claw", "Spirit of the Swarm", "Spirit of Vesper"],
  "Spirit of Caliban": ["Spirit of the Star-Eater", "Spirit of Synthoceps", "Spirit of Verity", "Spirit of the Coyote", "Spirit of Cyrtarachne", "Spirit of the Gyrfalcon", "Spirit of the Liar", "Spirit of the Wormhusk"],
  "Spirit of Galanor": ["Spirit of the Star-Eater", "Spirit of Synthoceps", "Spirit of Verity", "Spirit of the Coyote", "Spirit of Cyrtarachne", "Spirit of the Gyrfalcon", "Spirit of the Liar", "Spirit of the Wormhusk"],
  "Spirit of Renewal": ["Spirit of the Star-Eater", "Spirit of Synthoceps", "Spirit of Verity", "Spirit of the Coyote", "Spirit of Cyrtarachne", "Spirit of the Gyrfalcon", "Spirit of the Liar", "Spirit of the Wormhusk"],
  "Spirit of the Dragon": ["Spirit of the Star-Eater", "Spirit of Synthoceps", "Spirit of Verity", "Spirit of the Coyote", "Spirit of Cyrtarachne", "Spirit of the Gyrfalcon", "Spirit of the Liar", "Spirit of the Wormhusk"],
  "Spirit of the Foe Tracer": ["Spirit of the Star-Eater", "Spirit of Synthoceps", "Spirit of Verity", "Spirit of the Coyote", "Spirit of Cyrtarachne", "Spirit of the Gyrfalcon", "Spirit of the Liar", "Spirit of the Wormhusk"],
  "Spirit of Hoarfrost": ["Spirit of the Star-Eater", "Spirit of Synthoceps", "Spirit of Verity", "Spirit of Alpha Lupi", "Spirit of Contact", "Spirit of Scars", "Spirit of the Armamentarium", "Spirit of the Horn"],
  "Spirit of Severance": ["Spirit of the Star-Eater", "Spirit of Synthoceps", "Spirit of Verity", "Spirit of Alpha Lupi", "Spirit of Contact", "Spirit of Scars", "Spirit of the Armamentarium", "Spirit of the Horn"],
  "Spirit of the Abeyant": ["Spirit of the Star-Eater", "Spirit of Synthoceps", "Spirit of Verity", "Spirit of Alpha Lupi", "Spirit of Contact", "Spirit of Scars", "Spirit of the Armamentarium", "Spirit of the Horn"],
  "Spirit of the Bear": ["Spirit of the Star-Eater", "Spirit of Synthoceps", "Spirit of Verity", "Spirit of Alpha Lupi", "Spirit of Contact", "Spirit of Scars", "Spirit of the Armamentarium", "Spirit of the Horn"],
  "Spirit of the Eternal Warrior": ["Spirit of the Star-Eater", "Spirit of Synthoceps", "Spirit of Verity", "Spirit of Alpha Lupi", "Spirit of Contact", "Spirit of Scars", "Spirit of the Armamentarium", "Spirit of the Horn"],
  "Spirit of Apotheosis": ["Spirit of the Star-Eater", "Spirit of Synthoceps", "Spirit of Verity", "Spirit of Harmony", "Spirit of Starfire", "Spirit of the Claw", "Spirit of the Swarm", "Spirit of Vesper"],
  "Spirit of Osmiomancy": ["Spirit of the Star-Eater", "Spirit of Synthoceps", "Spirit of Verity", "Spirit of Harmony", "Spirit of Starfire", "Spirit of the Claw", "Spirit of the Swarm", "Spirit of Vesper"],
  "Spirit of the Stag": ["Spirit of the Star-Eater", "Spirit of Synthoceps", "Spirit of Verity", "Spirit of Harmony", "Spirit of Starfire", "Spirit of the Claw", "Spirit of the Swarm", "Spirit of Vesper"],
  "Spirit of the Filaments": ["Spirit of the Star-Eater", "Spirit of Synthoceps", "Spirit of Verity", "Spirit of Harmony", "Spirit of Starfire", "Spirit of the Claw", "Spirit of the Swarm", "Spirit of Vesper"],
  "Spirit of the Necrotic": ["Spirit of the Star-Eater", "Spirit of Synthoceps", "Spirit of Verity", "Spirit of Harmony", "Spirit of Starfire", "Spirit of the Claw", "Spirit of the Swarm", "Spirit of Vesper"],
} as const

// Complete list of all possible Perk 1 (left) options
const ALL_POSSIBLE_PERK1_OPTIONS = [
  "Spirit of the Assassin",
  "Spirit of Inmost Light",
  "Spirit of the Ophidian",
  "Spirit of Caliban",
  "Spirit of Galanor",
  "Spirit of Renewal",
  "Spirit of the Dragon",
  "Spirit of the Foe Tracer",
  "Spirit of Hoarfrost",
  "Spirit of Severance",
  "Spirit of the Abeyant",
  "Spirit of the Bear",
  "Spirit of the Eternal Warrior",
  "Spirit of Apotheosis",
  "Spirit of Osmiomancy",
  "Spirit of the Stag",
  "Spirit of the Filaments",
  "Spirit of the Necrotic",
] as const

// Complete list of all possible Perk 2 (right) options
const ALL_POSSIBLE_PERK2_OPTIONS = [
  "Spirit of the Star-Eater",
  "Spirit of Synthoceps",
  "Spirit of Verity",
  "Spirit of the Coyote",
  "Spirit of Cyrtarachne",
  "Spirit of the Gyrfalcon",
  "Spirit of the Liar",
  "Spirit of the Wormhusk",
  "Spirit of Alpha Lupi",
  "Spirit of Contact",
  "Spirit of Scars",
  "Spirit of the Armamentarium",
  "Spirit of the Horn",
  "Spirit of Harmony",
  "Spirit of Starfire",
  "Spirit of the Claw",
  "Spirit of the Swarm",
  "Spirit of Vesper",
] as const

// Reverse mapping for when Perk 2 is selected first
const PERK2_TO_PERK1_MAPPING = Object.entries(EXOTIC_PERK_MAPPING).reduce((acc, [perk1, perk2s]) => {
  perk2s.forEach(perk2 => {
    if (!acc[perk2]) acc[perk2] = []
    acc[perk2].push(perk1)
  })
  return acc
}, {} as Record<string, string[]>)

const formSchema = z.object({
  Health: z.number().min(0).max(200),
  Melee: z.number().min(0).max(200),
  Grenade: z.number().min(0).max(200),
  Super: z.number().min(0).max(200),
  Class: z.number().min(0).max(200),
  Weapons: z.number().min(0).max(200),
  // Minimum constraint locks for each stat
  Health_min: z.boolean(),
  Melee_min: z.boolean(),
  Grenade_min: z.boolean(),
  Super_min: z.boolean(),
  Class_min: z.boolean(),
  Weapons_min: z.boolean(),
  allow_tuned: z.boolean(),
  use_class_item_exotic: z.boolean(),
  exotic_perk1: z.string().optional(),
  exotic_perk2: z.string().optional(),
  // Subclass fragments: a baseline-stat module. `fragment_subclass` is the chosen
  // subclass id; `fragments` are the selected fragment names (all from that subclass).
  use_fragments: z.boolean(),
  fragment_subclass: z.string().optional(),
  fragments: z.array(z.string()),
  // "Build around specific pieces": up to MAX_LOCKED_PIECES owned pieces every build must include.
  use_locked_pieces: z.boolean(),
  locked_pieces: z.array(
    z.object({
      slot: z.enum(['helmet', 'arms', 'chest', 'legs', 'class']),
      archetype: z.string(),
      tertiary: z.string(),
      tuningMode: z.enum(['none', 'balanced', 'flexible', 'tuned']),
      tunedStat: z.string().optional(),
    }),
  ),
})

type FormData = z.infer<typeof formSchema>

interface StatInputFormProps {
  onSubmit: (data: FormData) => void
  isLoading?: boolean
  initialValues?: Partial<FormData>
}

export function StatInputForm({ onSubmit, isLoading = false, initialValues }: StatInputFormProps) {
  const defaultValues = React.useMemo(() => ({
    Health: 150,
    Melee: 75,
    Grenade: 75,
    Super: 100,
    Class: 75,
    Weapons: 25,
    // Default minimum constraints to false
    Health_min: false,
    Melee_min: false,
    Grenade_min: false,
    Super_min: false,
    Class_min: false,
    Weapons_min: false,
    allow_tuned: true,
    use_class_item_exotic: false,
    exotic_perk1: '',
    exotic_perk2: '',
    use_fragments: false,
    fragment_subclass: '',
    fragments: [] as string[],
    use_locked_pieces: false,
    locked_pieces: [] as LockedPiece[],
  }), [])

  // Load persisted state from sessionStorage first. Locked pieces are repaired/migrated so
  // stale-shaped entries (e.g. an older session) can't reach the solver malformed.
  const loadPersistedState = (): Partial<FormData> => {
    const saved = readJSON<Partial<FormData>>('session', STORAGE_KEYS.formState, {})
    if (saved && 'locked_pieces' in saved) {
      saved.locked_pieces = sanitizeLockedPieces(saved.locked_pieces)
    }
    return saved
  }

  // Save state to sessionStorage
  const saveFormState = (data: Partial<FormData>) => {
    writeJSON('session', STORAGE_KEYS.formState, data)
  }
  
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      ...defaultValues,
      ...loadPersistedState(),
      ...initialValues
    },
  })

  // Reset form when initialValues change (but preserve persisted state if no initialValues)
  React.useEffect(() => {
    if (initialValues && Object.keys(initialValues).length > 0) {
      const newValues = {
        ...defaultValues,
        ...loadPersistedState(),
        ...initialValues
      }
      form.reset(newValues)
      saveFormState(newValues)
    }
  }, [initialValues, form, defaultValues])

  // Save form state on every change
  React.useEffect(() => {
    const subscription = form.watch((value) => {
      saveFormState(value as FormData)
    })
    return () => subscription.unsubscribe()
  }, [form])

  const watchedValues = form.watch()
  const totalStats = STAT_NAMES.reduce((sum, statName) => sum + (watchedValues[statName] || 0), 0)

  // Selected fragments shift the baseline stats, which shifts the maximum achievable total
  // by the net of all their effects (e.g. one +10 fragment raises the max from 515 to 525).
  const selectedFragments = watchedValues.use_fragments ? watchedValues.fragments || [] : []
  const fragmentBonuses = computeFragmentBonuses(selectedFragments)
  const fragmentNet = STAT_NAMES.reduce((sum, statName) => sum + fragmentBonuses[statName], 0)
  const maxPossibleStats = MAX_POSSIBLE_TOTAL + fragmentNet
  const activeSubclass = watchedValues.fragment_subclass
    ? SUBCLASS_BY_ID[watchedValues.fragment_subclass]
    : undefined
  
  // Check if selected perk combination is valid
  const isValidPerkCombination = () => {
    if (!watchedValues.use_class_item_exotic) return true
    if (!watchedValues.exotic_perk1 || !watchedValues.exotic_perk2) return true
    
    const perk1 = watchedValues.exotic_perk1
    const perk2 = watchedValues.exotic_perk2
    
    // Check if perk1 -> perk2 is valid
    const perk1Options = EXOTIC_PERK_MAPPING[perk1 as keyof typeof EXOTIC_PERK_MAPPING]
    if (perk1Options && (perk1Options as readonly string[]).includes(perk2)) {
      return true
    }
    
    // Check if perk2 -> perk1 is valid (reverse direction)
    const perk2Options = EXOTIC_PERK_MAPPING[perk2 as keyof typeof EXOTIC_PERK_MAPPING]
    if (perk2Options && (perk2Options as readonly string[]).includes(perk1)) {
      return true
    }
    
    return false
  }
  
  // Get available perk1 options based on selected perk2
  const getAvailablePerk1Options = () => {
    // If no perk2 is selected, show all perk1 options
    if (!watchedValues.exotic_perk2) return ALL_POSSIBLE_PERK1_OPTIONS
    // If both are selected and valid, allow changing perk1 to any option
    if (watchedValues.exotic_perk1 && isValidPerkCombination()) return ALL_POSSIBLE_PERK1_OPTIONS
    // Otherwise, filter based on perk2
    return PERK2_TO_PERK1_MAPPING[watchedValues.exotic_perk2] || []
  }
  
  // Get available perk2 options based on selected perk1
  const getAvailablePerk2Options = () => {
    // If no perk1 is selected, show all perk2 options
    if (!watchedValues.exotic_perk1) return ALL_POSSIBLE_PERK2_OPTIONS
    // If both are selected and valid, allow changing perk2 to any option
    if (watchedValues.exotic_perk2 && isValidPerkCombination()) return ALL_POSSIBLE_PERK2_OPTIONS
    // Otherwise, filter based on perk1
    const validOptions = EXOTIC_PERK_MAPPING[watchedValues.exotic_perk1 as keyof typeof EXOTIC_PERK_MAPPING]
    return validOptions ? [...validOptions] : []
  }
  
  // Check if perks are missing when exotic class item is enabled
  const hasMissingPerks = () => {
    if (!watchedValues.use_class_item_exotic) return false
    return !watchedValues.exotic_perk1 || !watchedValues.exotic_perk2
  }

  // Direct field writers for the custom forge controls (RHF stays the source of truth).
  const setField = (name: keyof FormData, value: unknown) =>
    form.setValue(name, value as never, { shouldValidate: true })

  // Switch subclass. Since only one subclass's fragments may be equipped at a time, changing
  // the subclass clears any previously-selected fragments.
  const selectSubclass = (id: string) => {
    setField('fragment_subclass', id)
    setField('fragments', [])
  }

  // Toggle a single fragment on/off within the active subclass.
  const toggleFragment = (name: string) => {
    const current = watchedValues.fragments || []
    const next = current.includes(name)
      ? current.filter((f) => f !== name)
      : [...current, name]
    setField('fragments', next)
  }

  // --- Locked ("build around these") pieces -------------------------------------------------
  const lockedPieces: LockedPiece[] = watchedValues.locked_pieces || []
  const usesClassSlot = lockedPieces.some((p) => p.slot === 'class')

  const setLockedPieces = (next: LockedPiece[]) => setField('locked_pieces', next)

  // Slots already claimed by other locked pieces (so a piece can't double-book a slot). When
  // the exotic class item is enabled it owns the class slot, so that's unavailable too.
  const usedSlots = (exceptIndex: number): Set<GearSlot> => {
    const taken = new Set<GearSlot>()
    lockedPieces.forEach((p, i) => {
      if (i !== exceptIndex) taken.add(p.slot)
    })
    if (watchedValues.use_class_item_exotic) taken.add('class')
    return taken
  }

  const firstFreeSlot = (): GearSlot | null => {
    const taken = usedSlots(-1)
    return GEAR_SLOTS.find((s) => !taken.has(s)) ?? null
  }

  const addLockedPiece = () => {
    if (lockedPieces.length >= MAX_LOCKED_PIECES) return
    const slot = firstFreeSlot()
    if (!slot) return
    const first = ARCHETYPES[0]
    setLockedPieces([
      ...lockedPieces,
      {
        slot,
        archetype: first.name,
        tertiary: tertiaryOptions(first.name)[0],
        tuningMode: 'none',
        tunedStat: undefined,
      },
    ])
  }

  const removeLockedPiece = (index: number) => {
    setLockedPieces(lockedPieces.filter((_, i) => i !== index))
  }

  // Patch one locked piece, repairing dependent fields (tertiary must stay valid for the
  // archetype; tunedStat only applies to the "tuned" mode).
  const updateLockedPiece = (index: number, patch: Partial<LockedPiece>) => {
    const next = lockedPieces.map((p, i) => {
      if (i !== index) return p
      const merged = { ...p, ...patch }
      const validTertiaries = tertiaryOptions(merged.archetype)
      if (!validTertiaries.includes(merged.tertiary as (typeof validTertiaries)[number])) {
        merged.tertiary = validTertiaries[0]
      }
      if (merged.tuningMode !== 'tuned') merged.tunedStat = undefined
      else if (!merged.tunedStat) merged.tunedStat = STAT_NAMES[0]
      return merged
    })
    setLockedPieces(next)
  }

  // A locked class item and the exotic class item both occupy the class slot.
  const lockedClassItemConflict =
    watchedValues.use_locked_pieces && usesClassSlot && watchedValues.use_class_item_exotic

  const duplicateSlots =
    new Set(lockedPieces.map((p) => p.slot)).size !== lockedPieces.length

  const lockedPiecesInvalid =
    watchedValues.use_locked_pieces &&
    (lockedPieces.some((p) => !isLockedPieceValid(p)) || duplicateSlots || lockedClassItemConflict)

  const over = totalStats > maxPossibleStats
  const meterPct = Math.min(100, (totalStats / maxPossibleStats) * 100)

  // Build perk dropdown items with validity-based disabling (logic preserved).
  const perk1Items: ForgeSelectItem[] = ALL_POSSIBLE_PERK1_OPTIONS.map((perk) => {
    const availableOptions = getAvailablePerk1Options()
    const isAvailable = (availableOptions as readonly string[]).includes(perk)
    const disabled = Boolean(
      watchedValues.exotic_perk2 && !isAvailable && availableOptions.length < ALL_POSSIBLE_PERK1_OPTIONS.length
    )
    return { value: perk, label: perk, disabled }
  })
  const perk2Items: ForgeSelectItem[] = ALL_POSSIBLE_PERK2_OPTIONS.map((perk) => {
    const availableOptions = getAvailablePerk2Options()
    const isAvailable = (availableOptions as readonly string[]).includes(perk)
    const disabled = Boolean(
      watchedValues.exotic_perk1 && !isAvailable && availableOptions.length < ALL_POSSIBLE_PERK2_OPTIONS.length
    )
    return { value: perk, label: perk, disabled }
  })

  const submitDisabled =
    isLoading ||
    hasMissingPerks() ||
    (watchedValues.use_class_item_exotic && !isValidPerkCombination()) ||
    lockedPiecesInvalid

  return (
    <form className="form-col" onSubmit={form.handleSubmit(onSubmit)}>
      <div className="panel form-panel">
        <div className="panel-head">
          <span className="corner" />
          <span className="title">Desired Stats</span>
        </div>
        <div className="panel-body">
          {/* stat rows */}
          <div>
            {STAT_NAMES.map((statName) => {
              const value = watchedValues[statName] || 0
              const locked = Boolean(watchedValues[`${statName}_min` as keyof FormData])
              return (
                <div className="stat" key={statName}>
                  <div className="stat-top">
                    <div className="stat-name">
                      <StatIcon stat={statName} size={18} /> {statName}
                    </div>
                    <label className={"stat-lock" + (locked ? " active" : "")} title="Lock as minimum: solutions must have at least this value">
                      <Icon.lock className="lk" />
                      <span className="lbl">Min</span>
                      <ForgeSwitch
                        checked={locked}
                        onChange={(v) => setField(`${statName}_min` as keyof FormData, v)}
                        ariaLabel={`Lock ${statName} as minimum`}
                      />
                    </label>
                  </div>
                  <div className="stat-ctl">
                    <ForgeNumberField value={value} onChange={(v) => setField(statName, v)} />
                    <ForgeSlider
                      value={value}
                      onChange={(v) => setField(statName, v)}
                      locked={locked}
                      floor={locked ? value : null}
                    />
                  </div>
                </div>
              )
            })}
          </div>

          {/* total bar */}
          <div className={"totalbar" + (over ? " over" : "")}>
            <div className="l">
              <span className="cap">Total</span>
              <span className="val">{totalStats}</span>
            </div>
            <div className="r">
              <div className={"meter" + (over ? " over" : "")}>
                <span style={{ width: meterPct + "%" }} />
              </div>
              <span>MAX {maxPossibleStats}</span>
              <ForgeTooltip>
                Assuming all Tier 5 armor, five +10 stat mods, and five Balanced Tuning mods, 515 is
                the maximum total a set of armor can provide.
                {fragmentNet !== 0 && (
                  <>
                    {' '}Selected fragments shift the baseline by {fragmentNet > 0 ? '+' : ''}
                    {fragmentNet}, so the max is now {maxPossibleStats}.
                  </>
                )}
              </ForgeTooltip>
            </div>
          </div>
          {over && (
            <div className="notice warn">
              <Icon.alert className="ic" />
              <span>
                Desired stats exceed the maximum possible. The optimizer will return the closest
                achievable approximation.
              </span>
            </div>
          )}

          <div className="divider" />

          {/* options */}
          <div className="opt-stack">
          <div className="opt-row">
            <div className="opt-main">
              <div className="opt-label">Allow +5 / −5 Tuning Mods</div>
              <div className="opt-desc">
                Include pieces with ±5 stat tuning. Harder to farm, but unlock more optimization
                headroom.
              </div>
            </div>
            <ForgeSwitch
              checked={watchedValues.allow_tuned}
              onChange={(v) => setField("allow_tuned", v)}
              ariaLabel="Allow tuning mods"
            />
          </div>

          <div className="opt-row">
            <div className="opt-main">
              <div className="opt-label">
                Use Exotic Class Item
                <ForgeTooltip>
                  Exotic class item stat distributions are determined by their exotic perk
                  combinations — each combo has a pre-determined primary, secondary, and tertiary
                  stat. (Regular exotic armor now shares the same 30/25/20 roll and tuning as
                  legendary armor, so requiring one wouldn&apos;t constrain the result.)
                </ForgeTooltip>
              </div>
              <div className="opt-desc">
                Force one exotic class item with two fixed perks into the build.
              </div>
            </div>
            <ForgeSwitch
              checked={watchedValues.use_class_item_exotic}
              onChange={(v) => setField("use_class_item_exotic", v)}
              ariaLabel="Use exotic class item"
            />
          </div>

          {watchedValues.use_class_item_exotic && (
                <div className="opt-nest">
                  <div className="opt-label" style={{ marginBottom: 4 }}>
                    Exotic Class Item Perks
                    <ForgeTooltip>
                      Some perk combinations are unavailable while their stat distributions remain
                      uncertain.
                    </ForgeTooltip>
                  </div>
                  <div className="opt-desc" style={{ marginBottom: 12 }}>
                    Pick two perks. Only certain combinations are valid.
                  </div>
                  <div className="perk-grid">
                    <div>
                      <div className="subhead" style={{ margin: "0 0 8px" }}>
                        First Perk
                      </div>
                      <ForgeSelect
                        value={watchedValues.exotic_perk1}
                        placeholder="Select first perk"
                        items={perk1Items}
                        onChange={(v) => setField("exotic_perk1", v)}
                      />
                    </div>
                    <div>
                      <div className="subhead" style={{ margin: "0 0 8px" }}>
                        Second Perk
                      </div>
                      <ForgeSelect
                        value={watchedValues.exotic_perk2}
                        placeholder="Select second perk"
                        items={perk2Items}
                        onChange={(v) => setField("exotic_perk2", v)}
                      />
                    </div>
                  </div>
                  {hasMissingPerks() && (
                    <div className="notice bad" style={{ marginTop: 12 }}>
                      <Icon.alert className="ic" />
                      <span>Select both perks to use the exotic class item.</span>
                    </div>
                  )}
                  {!isValidPerkCombination() &&
                    watchedValues.exotic_perk1 &&
                    watchedValues.exotic_perk2 && (
                      <div className="notice warn" style={{ marginTop: 12 }}>
                        <Icon.alert className="ic" />
                        <span>
                          Invalid combination:{" "}
                          {watchedValues.exotic_perk1.replace("Spirit of ", "")} +{" "}
                          {watchedValues.exotic_perk2.replace("Spirit of ", "")}. Pick one perk first
                          to see valid options for the other.
                        </span>
                      </div>
                    )}
                </div>
              )}

          <div className="opt-row">
            <div className="opt-main">
              <div className="opt-label">
                Use Subclass Fragments
                <ForgeTooltip>
                  Fragments shift your baseline stats before armor is applied. Selecting them
                  raises (or lowers) your starting stat floor and adjusts the maximum achievable
                  total accordingly. Only fragments from a single subclass can be equipped at once.
                </ForgeTooltip>
              </div>
              <div className="opt-desc">
                Factor in the ±10 / −20 baseline stat changes from your equipped subclass fragments.
              </div>
            </div>
            <ForgeSwitch
              checked={watchedValues.use_fragments}
              onChange={(v) => setField('use_fragments', v)}
              ariaLabel="Use subclass fragments"
            />
          </div>

          {watchedValues.use_fragments && (
            <div className="opt-nest">
              <div className="opt-label" style={{ marginBottom: 8 }}>Subclass</div>
              <div className="subclass-grid">
                {SUBCLASSES.map((sc) => {
                  const active = watchedValues.fragment_subclass === sc.id
                  return (
                    <button
                      type="button"
                      key={sc.id}
                      className={'subclass-chip' + (active ? ' active' : '')}
                      style={active ? { borderColor: sc.accent, color: sc.accent } : undefined}
                      onClick={() => selectSubclass(sc.id)}
                    >
                      <span className="dot" style={{ background: sc.accent }} />
                      {sc.name}
                    </button>
                  )
                })}
              </div>

              {activeSubclass && (
                <div style={{ marginTop: 14 }}>
                  <div className="subhead" style={{ margin: '0 0 10px' }}>
                    {activeSubclass.name} Fragments
                  </div>
                  <div className="frag-grid">
                    {activeSubclass.fragments.map((frag) => {
                      const selected = (watchedValues.fragments || []).includes(frag.name)
                      return (
                        <button
                          type="button"
                          key={frag.name}
                          className={'frag-card' + (selected ? ' selected' : '')}
                          onClick={() => toggleFragment(frag.name)}
                          aria-pressed={selected}
                        >
                          <span className="frag-ico">
                            {frag.icon ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={frag.icon} alt="" loading="lazy" />
                            ) : (
                              <Icon.package className="ph" />
                            )}
                          </span>
                          <span className="frag-meta">
                            <span className="frag-name">{frag.name}</span>
                            <span className="frag-effect">
                              {Object.entries(frag.effects).map(([stat, delta]) => (
                                <span
                                  className={'frag-chip ' + (delta > 0 ? 'plus' : 'minus')}
                                  key={stat}
                                >
                                  {delta > 0 ? '+' : ''}{delta}
                                  <StatIcon stat={stat} size={12} /> {stat}
                                </span>
                              ))}
                            </span>
                          </span>
                          {selected && <Icon.check className="frag-check" />}
                        </button>
                      )
                    })}
                  </div>

                  {selectedFragments.length > 0 && (
                    <div className="notice info" style={{ marginTop: 12 }}>
                      <Icon.info className="ic" />
                      <span>
                        {selectedFragments.length} fragment{selectedFragments.length !== 1 ? 's' : ''}{' '}
                        selected · baseline shift{' '}
                        {STAT_NAMES.filter((s) => fragmentBonuses[s] !== 0)
                          .map((s) => `${fragmentBonuses[s] > 0 ? '+' : ''}${fragmentBonuses[s]} ${s}`)
                          .join(', ')}
                        .
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="opt-row">
            <div className="opt-main">
              <div className="opt-label">
                Build Around Specific Pieces
                <span className="beta-tag">Beta</span>
                <ForgeTooltip>
                  Lock up to {MAX_LOCKED_PIECES} armor pieces you already own. Every build will
                  include them and optimize the remaining slots around them. Their tuning is
                  honored even when &ldquo;Allow Tuning Mods&rdquo; is off, and they&apos;re
                  pre-marked as acquired in saved checklists.
                </ForgeTooltip>
              </div>
              <div className="opt-desc">
                Pin owned pieces (archetype, tertiary, tuning) and optimize the rest of the build
                around them.
              </div>
            </div>
            <ForgeSwitch
              checked={watchedValues.use_locked_pieces}
              onChange={(v) => setField('use_locked_pieces', v)}
              ariaLabel="Build around specific pieces"
            />
          </div>

          {watchedValues.use_locked_pieces && (
            <div className="opt-nest">
              {lockedPieces.length === 0 && (
                <div className="opt-desc" style={{ marginBottom: 12 }}>
                  No pieces locked yet. Add a piece you already own to build around it.
                </div>
              )}

              <div className="locked-list">
                {lockedPieces.map((piece, index) => {
                  const taken = usedSlots(index)
                  const slotItems: ForgeSelectItem[] = GEAR_SLOTS.map((s) => ({
                    value: s,
                    label:
                      GEAR_SLOT_LABEL[s] +
                      (s === 'class' && watchedValues.use_class_item_exotic ? ' (exotic in use)' : ''),
                    disabled: taken.has(s),
                  }))
                  const archItems: ForgeSelectItem[] = ARCHETYPES.map((a) => ({
                    value: a.name,
                    label: a.name,
                  }))
                  const tertItems: ForgeSelectItem[] = tertiaryOptions(piece.archetype).map((s) => ({
                    value: s,
                    label: s,
                  }))
                  const tuningItems: ForgeSelectItem[] = [
                    { value: 'none', label: 'No tuning' },
                    { value: 'flexible', label: 'Flexible (optimizer decides)' },
                    { value: 'balanced', label: 'Balanced (+1 lowest 3)' },
                    { value: 'tuned', label: '+5 specific stat…' },
                  ]
                  const tunedStatItems: ForgeSelectItem[] = STAT_NAMES.map((s) => ({
                    value: s,
                    label: `+5 ${s}`,
                  }))
                  return (
                    <div className="locked-card" key={index}>
                      <div className="locked-card-head">
                        <span className="subhead" style={{ margin: 0 }}>
                          Piece {index + 1}
                        </span>
                        <button
                          type="button"
                          className="btn icon sm"
                          onClick={() => removeLockedPiece(index)}
                          aria-label={`Remove piece ${index + 1}`}
                        >
                          <Icon.x style={{ width: 14, height: 14 }} />
                        </button>
                      </div>

                      <div className="perk-grid">
                        <div>
                          <div className="subhead" style={{ margin: '0 0 8px' }}>
                            Slot
                          </div>
                          <ForgeSelect
                            value={piece.slot}
                            items={slotItems}
                            onChange={(v) => updateLockedPiece(index, { slot: v as GearSlot })}
                          />
                        </div>
                        <div>
                          <div className="subhead" style={{ margin: '0 0 8px' }}>
                            Archetype
                          </div>
                          <ForgeSelect
                            value={piece.archetype}
                            items={archItems}
                            onChange={(v) => updateLockedPiece(index, { archetype: v })}
                          />
                        </div>
                      </div>

                      <div className="perk-grid" style={{ marginTop: 10 }}>
                        <div>
                          <div className="subhead" style={{ margin: '0 0 8px' }}>
                            Tertiary Stat
                          </div>
                          <ForgeSelect
                            value={piece.tertiary}
                            items={tertItems}
                            onChange={(v) => updateLockedPiece(index, { tertiary: v })}
                          />
                        </div>
                        <div />
                      </div>

                      <div className="perk-grid" style={{ marginTop: 10 }}>
                        <div>
                          <div className="subhead" style={{ margin: '0 0 8px' }}>
                            Tuning
                          </div>
                          <ForgeSelect
                            value={piece.tuningMode}
                            items={tuningItems}
                            onChange={(v) =>
                              updateLockedPiece(index, { tuningMode: v as LockedTuningMode })
                            }
                          />
                        </div>
                        {piece.tuningMode === 'tuned' && (
                          <div>
                            <div className="subhead" style={{ margin: '0 0 8px' }}>
                              +5 Target
                            </div>
                            <ForgeSelect
                              value={piece.tunedStat}
                              placeholder="Select stat"
                              items={tunedStatItems}
                              onChange={(v) => updateLockedPiece(index, { tunedStat: v })}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>

              {lockedPieces.length < MAX_LOCKED_PIECES && (
                <button
                  type="button"
                  className="btn sm"
                  style={{ marginTop: lockedPieces.length ? 12 : 0 }}
                  onClick={addLockedPiece}
                >
                  <Icon.plus style={{ width: 14, height: 14 }} /> Add Piece
                </button>
              )}

              {duplicateSlots && (
                <div className="notice bad" style={{ marginTop: 12 }}>
                  <Icon.alert className="ic" />
                  <span>Each locked piece must use a different gear slot.</span>
                </div>
              )}
              {lockedClassItemConflict && (
                <div className="notice bad" style={{ marginTop: 12 }}>
                  <Icon.alert className="ic" />
                  <span>
                    A locked class item conflicts with the Exotic Class Item — both use the class
                    slot. Turn one off.
                  </span>
                </div>
              )}
            </div>
          )}

          </div>
        </div>

        <div className="panel-foot">
          <button
            className="btn primary block"
            type="submit"
            disabled={submitDisabled}
          >
            {isLoading ? "Optimizing…" : "Find Optimal Builds"}
          </button>
        </div>
      </div>
    </form>
  )
}