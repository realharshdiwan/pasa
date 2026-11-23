import type { DieFace } from './types'
import { DIE_FACES } from './die'

/**
 * Fast, deterministic 32-bit PRNG (Mulberry32).
 * Given a 32-bit unsigned integer seed, generates uniform pseudo-random numbers in [0, 1).
 */
export function createMulberry32(initialSeed: number): () => number {
  let s = initialSeed >>> 0
  return function next(): number {
    s = (s + 0x6d2b79f5) | 0
    let t = Math.imul(s ^ (s >>> 15), 1 | s)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/**
 * Deterministically roll a die given a match seed and turn sequence number.
 * Ensures the exact same roll occurs on server and client for a given turn.
 */
export function rollDieWithSeed(matchSeed: number, turnSeq: number): DieFace {
  // Combine match seed and turn sequence using a hash mixer
  const combinedSeed = (matchSeed ^ (turnSeq * 0x9e3779b9)) >>> 0
  const rng = createMulberry32(combinedSeed)
  const faceIndex = Math.floor(rng() * DIE_FACES.length)
  const normalizedIndex = Math.min(Math.max(faceIndex, 0), DIE_FACES.length - 1)
  return DIE_FACES[normalizedIndex]
}

/**
 * Generate a random 32-bit unsigned integer seed for starting a new match.
 */
export function generateMatchSeed(): number {
  return (Math.random() * 0xffffffff) >>> 0
}
