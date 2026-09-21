/**
 * Exact fractions, for quantities inside the engine.
 *
 * A need is not a round number. Six 1.0 x 1.0 x 0.25 m footings at 9 bags of
 * cement per m3 need exactly 13.5 bags; a wall needs exactly 101.25 blocks.
 * Nothing may be rounded until the purchase line, or the rounding happens
 * more than once and the answer drifts.
 *
 * So a quantity is a BigInt numerator over a power-of-ten denominator, and
 * the denominator travels with the value. Multiplying multiplies both halves,
 * which is exact; BigInt has no size limit, so mm x mm x mm x a factor in
 * millionths cannot overflow the way a plain number would past 9 x 10^15.
 *
 * Division is the only lossy operation, so it is never implicit: the callers
 * that need it (paint coverage, steel weight) ask for `ceilToThousandths` or
 * `toDecimalString` and the rounding becomes a decision someone wrote down.
 */

export type Fraction = {
  readonly n: bigint
  /** Always greater than zero. */
  readonly d: bigint
}

function gcd(a: bigint, b: bigint): bigint {
  let x = a < 0n ? -a : a
  let y = b < 0n ? -b : b
  while (y !== 0n) {
    const t = x % y
    x = y
    y = t
  }
  return x
}

/**
 * Build a fraction, normalised: the sign lives on the numerator and the
 * fraction is reduced, so equal values are always the same pair and the
 * numbers stay small enough to read in a failure message.
 */
export function fraction(numerator: bigint, denominator: bigint = 1n): Fraction {
  if (denominator === 0n) {
    throw new RangeError('A fraction cannot have a denominator of zero.')
  }
  let n = numerator
  let d = denominator
  if (d < 0n) {
    n = -n
    d = -d
  }
  if (n === 0n) return { n: 0n, d: 1n }
  const g = gcd(n, d)
  return { n: n / g, d: d / g }
}

export function fromInteger(value: number | bigint): Fraction {
  if (typeof value === 'number' && !Number.isSafeInteger(value)) {
    throw new RangeError(
      `fromInteger needs a whole number that JavaScript holds exactly, got ${value}.`,
    )
  }
  return { n: BigInt(value), d: 1n }
}

export const ZERO: Fraction = { n: 0n, d: 1n }

export function multiply(a: Fraction, b: Fraction): Fraction {
  return fraction(a.n * b.n, a.d * b.d)
}

export function add(a: Fraction, b: Fraction): Fraction {
  return fraction(a.n * b.d + b.n * a.d, a.d * b.d)
}

export function subtract(a: Fraction, b: Fraction): Fraction {
  return fraction(a.n * b.d - b.n * a.d, a.d * b.d)
}

/** -1 if a is less than b, 0 if they are equal, 1 if a is greater. */
export function compare(a: Fraction, b: Fraction): -1 | 0 | 1 {
  const left = a.n * b.d
  const right = b.n * a.d
  if (left < right) return -1
  if (left > right) return 1
  return 0
}

export const isZero = (f: Fraction): boolean => f.n === 0n
export const isNegative = (f: Fraction): boolean => f.n < 0n

/** Whole-number division that rounds towards positive infinity. */
function ceilDiv(n: bigint, d: bigint): bigint {
  const q = n / d
  // BigInt division truncates towards zero, so a positive remainder needs
  // one more step up and a negative one is already there.
  return n % d !== 0n && n > 0n ? q + 1n : q
}

/**
 * The exact need, in whole thousandths of a unit, rounded UP.
 *
 * This is the doorway out of exact arithmetic, and the only rounding the
 * engine does before the purchase line. It is safe to follow with
 * `roundUpToStep` because every purchase step is a whole number of
 * thousandths, so rounding up twice lands on the same answer as rounding up
 * once.
 */
export function ceilToThousandths(f: Fraction): number {
  const thousandths = ceilDiv(f.n * 1000n, f.d)
  if (
    thousandths > BigInt(Number.MAX_SAFE_INTEGER) ||
    thousandths < BigInt(Number.MIN_SAFE_INTEGER)
  ) {
    throw new RangeError(
      `That quantity is too large to be a real order: ${thousandths} thousandths.`,
    )
  }
  return Number(thousandths)
}

/**
 * The value as text, to a fixed number of decimal places, with a half step
 * rounded away from zero.
 *
 * For showing the working ("6.21 m2 x 12.5 pcs/m2 = 77.625"), never for
 * feeding another sum.
 */
export function toDecimalString(f: Fraction, places: number): string {
  if (!Number.isInteger(places) || places < 0 || places > 12) {
    throw new RangeError(`toDecimalString needs 0 to 12 decimal places, got ${places}.`)
  }
  const scale = 10n ** BigInt(places)
  const negative = f.n < 0n
  const n = negative ? -f.n : f.n

  // Half away from zero, on whole numbers: double the remainder and compare
  // it with the denominator, so nothing is ever divided in floating point.
  const scaled = (n * scale) / f.d
  const remainder = (n * scale) % f.d
  const rounded = remainder * 2n >= f.d ? scaled + 1n : scaled

  const digits = rounded.toString().padStart(places + 1, '0')
  const whole = digits.slice(0, digits.length - places)
  const decimals = places === 0 ? '' : `.${digits.slice(digits.length - places)}`
  return `${negative && rounded !== 0n ? '-' : ''}${whole}${decimals}`
}
