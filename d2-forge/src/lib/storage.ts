// Small helpers for safe JSON access to localStorage/sessionStorage and for
// parsing the JSON-string piece keys used in solutions.
//
// Callers pass a storage kind ("session" | "local") rather than the Storage
// object itself: referencing the `sessionStorage`/`localStorage` globals during
// server-side rendering throws a ReferenceError, so we resolve them internally
// behind a `typeof window` guard.

import type { PieceType } from "@/types/solution"

type StorageKind = "session" | "local"

function getStorage(kind: StorageKind): Storage | null {
  if (typeof window === "undefined") return null
  return kind === "session" ? window.sessionStorage : window.localStorage
}

// Read and JSON-parse a value, returning `fallback` on miss, SSR, or error.
export function readJSON<T>(kind: StorageKind, key: string, fallback: T): T {
  const storage = getStorage(kind)
  if (!storage) return fallback
  try {
    const raw = storage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

// JSON-stringify and write a value. Returns false on SSR or write failure.
export function writeJSON(kind: StorageKind, key: string, value: unknown): boolean {
  const storage = getStorage(kind)
  if (!storage) return false
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
