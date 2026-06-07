// Small helpers for safe JSON access to localStorage/sessionStorage and for
// parsing the JSON-string piece keys used in solutions.

import type { PieceType } from "@/types/solution"

// Read and JSON-parse a value, returning `fallback` on miss or error.
export function readJSON<T>(storage: Storage, key: string, fallback: T): T {
  try {
    const raw = storage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

// JSON-stringify and write a value. Returns false if storage write fails.
export function writeJSON(storage: Storage, key: string, value: unknown): boolean {
  try {
    storage.setItem(key, JSON.stringify(value))
    return true
  } catch (error) {
    console.warn(`Failed to write "${key}" to storage:`, error)
    return false
  }
}

// Parse a solution's piece key (a JSON-stringified PieceType). Returns null on
// malformed input.
export function parsePiece(pieceKey: string): PieceType | null {
  try {
    return JSON.parse(pieceKey) as PieceType
  } catch (error) {
    console.warn("Failed to parse piece:", pieceKey, error)
    return null
  }
}
