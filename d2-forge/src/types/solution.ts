// Shared types describing an optimizer solution and its armor pieces.

export interface PieceType {
  arch: string
  tertiary: string
  tuning_mode: string // "none", "tuned", "balanced"
  mod_target: string
  tuned_stat?: string | null
  siphon_from?: string | null
  // null for solver-chosen pieces; "armor" | "class" for user-locked (owned) pieces.
  slot?: string | null
}

export interface Solution {
  pieces: Record<string, number> // PieceType (as a JSON string key) -> count
  deviation: number
  actualStats?: number[]
  tuningRequirements?: Record<string, Array<{ count: number; siphon_from: string }>>
  flexiblePieces?: number // count of pieces that can accept any +5/-5 tuning
}
