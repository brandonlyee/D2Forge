// Shared app-wide constants.

// The six Destiny 2 armor stats, in canonical order.
export const STAT_NAMES = ["Health", "Melee", "Grenade", "Super", "Class", "Weapons"] as const
export type StatName = (typeof STAT_NAMES)[number]

// Max total stats: 5 pieces * 103 max per piece (with balanced tuning).
export const MAX_POSSIBLE_TOTAL = 515

// Browser storage keys. Centralized to avoid typos and ease refactoring.
export const STORAGE_KEYS = {
  formState: "d2forge-form-state",
  mainState: "d2forge-main-state",
  savedSolutions: "d2forge-saved-solutions",
  checklists: "d2forge-checklists",
} as const
