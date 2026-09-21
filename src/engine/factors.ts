import type { ChbThickness, ConcreteClass, MortarClass } from './classes'
import { millionths, type Millionths } from './units'

/**
 * Factors: how much material one unit of work takes.
 *
 * **No test can prove a factor is right.** A test proves the code matches the
 * table. Whether the table matches reality is a question only a person with a
 * reference book open can answer, so every factor carries where it came from
 * and when it was last checked.
 *
 * The engine takes the table as an argument rather than importing one. Tests
 * pass a frozen table that never changes, so correcting a real factor later
 * cannot turn the suite red — and a frozen table can keep one factor
 * unverified on purpose, which is how the "unverified" chip gets tested.
 */

export type Allowance =
  /** The book's figure is the bare requirement; wastage is ours to add. */
  | 'net'
  /** The book already built waste in. Adding wastage on top counts it twice. */
  | 'includes-allowance'

export type Factor = {
  readonly key: string
  /** In whole millionths. 12.5 is 12_500_000; 0.0435 is 43_500. */
  readonly value: Millionths
  /** What the value counts, for the show-your-work line: `pcs/m²`, `bags/m³`. */
  readonly unit: string
  readonly allowance: Allowance
  /** Book, edition, page or table. Never "the internet". */
  readonly source: string
  /** ISO date this was checked against the source. `null` means unverified. */
  readonly verifiedOn: string | null
}

export type FactorTable = {
  /** Named so a failure says which table it came from. */
  readonly id: string
  readonly description: string
  readonly factors: Readonly<Record<string, Factor>>
}

/* ── Keys ───────────────────────────────────────────────────────────────────
 * Built by function, never typed by hand, so a typo cannot reach the table.
 * The same strings appear in docs/factors.md, so the two cannot drift apart.
 */

export const CHB_BLOCKS_PER_M2 = 'chb.blocks.per.m2'

export const mortarCementKey = (thickness: ChbThickness, mortar: MortarClass): string =>
  `chb.mortar.cement.${thickness}.${mortar}`

export const mortarSandKey = (thickness: ChbThickness, mortar: MortarClass): string =>
  `chb.mortar.sand.${thickness}.${mortar}`

export const concreteCementKey = (concrete: ConcreteClass): string =>
  `concrete.cement.${concrete}`

export const concreteSandKey = (concrete: ConcreteClass): string => `concrete.sand.${concrete}`

export const concreteGravelKey = (concrete: ConcreteClass): string =>
  `concrete.gravel.${concrete}`

/* ── Reading the table ──────────────────────────────────────────────────── */

/**
 * A missing factor throws rather than returning zero.
 *
 * Zero would be the worst possible answer: a quietly missing material, on a
 * quotation that otherwise looks complete.
 */
export function getFactor(table: FactorTable, key: string): Factor {
  const factor = table.factors[key]
  if (!factor) {
    throw new Error(
      `Factor "${key}" is missing from the factor table "${table.id}". ` +
        `A missing factor would silently drop a material from the estimate.`,
    )
  }
  return factor
}

/** Whether anything in this table still needs checking against its source. */
export const unverifiedFactors = (table: FactorTable): readonly Factor[] =>
  Object.values(table.factors).filter((f) => f.verifiedOn === null)

/** Build a factor from a decimal figure as the book prints it. */
export function factorFromDecimal(
  key: string,
  decimal: string,
  unit: string,
  allowance: Allowance,
  source: string,
  verifiedOn: string | null = null,
): Factor {
  return {
    key,
    value: millionths(decimalToMillionths(decimal, key)),
    unit,
    allowance,
    source,
    verifiedOn,
  }
}

/**
 * `'12.5'` becomes 12_500_000, by moving the decimal point in the text.
 *
 * Never `parseFloat(decimal) * 1_000_000`: that is the same trap as
 * `parseMetres`, one order of magnitude further down, where a book's
 * four-decimal figure such as 0.0435 would lose its last digit.
 */
export function decimalToMillionths(decimal: string, key = 'a factor'): number {
  const match = /^(\d+)(?:\.(\d+))?$/.exec(decimal.trim())
  if (!match) {
    throw new RangeError(`${key}: "${decimal}" is not a plain positive decimal.`)
  }
  const [, whole, fraction = ''] = match
  if (fraction.length > 6) {
    throw new RangeError(
      `${key}: "${decimal}" has more than six decimal places, which millionths cannot hold exactly. ` +
        `Round it yourself, and say so in docs/factors.md.`,
    )
  }
  return Number(BigInt(whole) * 1_000_000n + BigInt(fraction.padEnd(6, '0') || '0'))
}
