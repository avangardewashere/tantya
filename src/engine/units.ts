/**
 * The units Tantya measures in.
 *
 * Every one of these is a WHOLE NUMBER. Floats are the trap this project
 * exists to avoid: in JavaScript `0.1 * 3 * 10` is 3.0000000000000004, and a
 * slab that needs 27 bags of cement quietly becomes 28.
 *
 * The brands are compile-time only. They cost nothing at runtime, but they
 * stop a length being passed where a price is wanted, and — from Block 1 — a
 * concrete class being passed where a mortar class is wanted, which matters
 * because the two share their letters and mean different mixes.
 */

declare const unitBrand: unique symbol

type Branded<T, B extends string> = T & { readonly [unitBrand]: B }

/** A length, in whole millimetres. `'2.70'` metres is 2700. */
export type Millimetres = Branded<number, 'Millimetres'>

/**
 * A factor, in whole millionths. 12.5 blocks per m² is 12_500_000.
 * Millionths hold a four-decimal factor from a book, such as 0.0435, with
 * nothing lost.
 */
export type Millionths = Branded<number, 'Millionths'>

/** A percentage, in hundredths of a percent. 5% is 500. */
export type BasisPoints = Branded<number, 'BasisPoints'>

/** Money, in whole centavos. ₱1,250.50 is 125050. */
export type Centavos = Branded<number, 'Centavos'>

/** A quantity to buy, in whole thousandths of its unit. 2.5 m³ is 2500. */
export type Thousandths = Branded<number, 'Thousandths'>

function whole(value: number, unit: string): number {
  if (!Number.isSafeInteger(value)) {
    throw new RangeError(
      `${unit} must be a whole number that JavaScript can hold exactly, got ${value}. ` +
        `This is the float trap: do the sum in whole units instead.`,
    )
  }
  return value
}

function nonNegativeWhole(value: number, unit: string): number {
  if (whole(value, unit) < 0) {
    throw new RangeError(`${unit} must not be negative, got ${value}.`)
  }
  return value
}

export const millimetres = (value: number) =>
  nonNegativeWhole(value, 'A length in millimetres') as Millimetres

export const millionths = (value: number) =>
  nonNegativeWhole(value, 'A factor in millionths') as Millionths

/** Basis points may be negative: a discount is a negative percentage. */
export const basisPoints = (value: number) =>
  whole(value, 'A percentage in basis points') as BasisPoints

/** Centavos may be negative: a credit line on a quote. */
export const centavos = (value: number) =>
  whole(value, 'An amount in centavos') as Centavos

export const thousandths = (value: number) =>
  nonNegativeWhole(value, 'A quantity in thousandths') as Thousandths

/** How many millionths make one whole. Named so the sums read as sentences. */
export const ONE_MILLIONTH_UNIT = 1_000_000

/** How many basis points make 100%. */
export const ONE_HUNDRED_PERCENT_BP = 10_000

/** How many thousandths make one whole unit. */
export const ONE_THOUSANDTH_UNIT = 1_000

/** How many millimetres make one metre. */
export const MILLIMETRES_PER_METRE = 1_000
