import type { ChbThickness, ConcreteClass, ConcreteShape, MortarClass } from './classes'
import type { Fraction } from './fraction'
import type { MaterialId } from './materials'
import type { BasisPoints, Millimetres } from './units'

/**
 * A piece of work, what it needs, and what that turns into at the counter.
 *
 * Three types, in the order the numbers travel:
 *
 *   WorkItem      what someone measured
 *   MaterialNeed  what that works out to, EXACTLY — never rounded
 *   PurchaseLine  what to buy, rounded up once, at the counter
 *
 * Keeping the middle one exact is the whole architecture. Round a need and
 * the error is baked in before anything is added together.
 */

export type Opening = {
  readonly label?: string
  readonly width: Millimetres
  readonly height: Millimetres
  /** How many of this opening. A row of three identical windows is count 3. */
  readonly count: number
}

export type ChbWallItem = {
  readonly kind: 'chbWall'
  readonly id: string
  readonly label: string
  /**
   * Wastage, in basis points. 5% is 500.
   *
   * Applied BEFORE rounding up, never after: a 3.0 × 2.7 m wall at 5% is
   * 106.3125 blocks, so 107 — the wrong order gives 108.
   *
   * There is no field for this on the form until Block 2. The rule lives here
   * now so it is right before anything can set it.
   */
  readonly wastage: BasisPoints
  readonly length: Millimetres
  readonly height: Millimetres
  readonly thickness: ChbThickness
  readonly openings: readonly Opening[]
  readonly mortarClass: MortarClass
}

export type ConcreteItem = {
  readonly kind: 'concrete'
  readonly id: string
  readonly label: string
  readonly wastage: BasisPoints
  readonly shape: ConcreteShape
  readonly length: Millimetres
  readonly width: Millimetres
  readonly depth: Millimetres
  /** How many of this pour. Six identical footings is count 6. */
  readonly count: number
  readonly concreteClass: ConcreteClass
}

/**
 * Block 2 adds `custom`, Block 5 adds `rebar`, Block 6 adds `paint`. Each new
 * member makes TypeScript list every `switch` that has not been updated —
 * which is the reason this is a union and not a bag of optional fields.
 */
export type WorkItem = ChbWallItem | ConcreteItem

export type MaterialNeed = {
  readonly material: MaterialId
  /** Exact. Nothing is rounded before the purchase line. */
  readonly quantity: Fraction
  /** The show-your-work line: `6.21 m² × 12.5 pcs/m² = 77.625`. */
  readonly because: string
  readonly fromItemId: string
  /** True when the factor behind this need has never been checked. */
  readonly unverifiedFactor: boolean
}

export type PurchaseLine = {
  readonly material: MaterialId
  /** Rounded up to the store's step, in thousandths of the unit. */
  readonly quantityThousandths: number
  /** The exact total before rounding, kept so the screen can show both. */
  readonly exactQuantity: Fraction
  /** Which work items fed this line. */
  readonly feeds: readonly string[]
  /** Every working line that fed it, in item order. */
  readonly workings: readonly string[]
  /** True when any factor behind this line is unverified. */
  readonly unverifiedFactor: boolean
}

/* ── Errors ────────────────────────────────────────────────────────────── */

export type CalculationErrorCode =
  | 'OPENINGS_EXCEED_WALL'
  | 'COUNT_OUT_OF_RANGE'
  | 'TOO_MANY_OPENINGS'
  | 'NOT_POSITIVE'

export type CalculationError = {
  readonly code: CalculationErrorCode
  /** Shown next to the field that caused it, so it says what to change. */
  readonly message: string
}

/** A pour of more than this is a data-entry slip, not a job. */
export const MAX_COUNT = 100

/** More openings than this on one wall is a slip too. */
export const MAX_OPENINGS = 50
