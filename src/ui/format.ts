import type { Unit } from '@/engine/materials'

/**
 * Turning whole numbers into something readable, without ever dividing.
 *
 * `102000` thousandths of a piece is "102 pcs". The obvious version,
 * `thousandths / 1000`, is a float division on a number that can reach
 * 10^15 — it happens to be exact at these sizes, but this is the one file
 * in the app whose job is to be trusted at a glance, and a rule that has an
 * exception is a rule someone will break somewhere it matters.
 */

/** Split whole thousandths into its whole part and its three decimals. */
function split(thousandths: number): { whole: string; decimals: string } {
  const digits = Math.abs(thousandths).toString().padStart(4, '0')
  return { whole: digits.slice(0, -3), decimals: digits.slice(-3) }
}

/** `1018000` becomes "1,018,000". Grouped, because these get long. */
function group(whole: string): string {
  return whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

/** The quantity alone: "102", "1,018,000", "0.5". */
export function formatThousandths(thousandths: number, minimumDecimals = 0): string {
  const { whole, decimals } = split(thousandths)
  const trimmed = decimals.replace(/0+$/, '')
  const shown = trimmed.padEnd(minimumDecimals, '0')
  const sign = thousandths < 0 ? '-' : ''
  return `${sign}${group(whole)}${shown ? `.${shown}` : ''}`
}

/** How a unit reads next to a number. */
export function formatUnit(unit: Unit, thousandths: number): string {
  if (unit === 'm3') return 'm³'
  const isOne = thousandths === 1000
  switch (unit) {
    case 'pc':
      return isOne ? 'pc' : 'pcs'
    case 'bag':
      return isOne ? 'bag' : 'bags'
    case 'can':
      return isOne ? 'can' : 'cans'
    case 'kg':
      return 'kg'
    case 'lot':
      return isOne ? 'lot' : 'lots'
  }
}

/**
 * What to buy, as one string: "102 pcs", "14 bags", "0.5 m³".
 *
 * One string and not two elements, so it reads as one thing to a screen
 * reader and can be found as one thing in a test.
 */
export function formatQuantity(thousandths: number, unit: Unit): string {
  // Cubic metres always show a decimal, because the step is half a metre and
  // "1 m³" next to "1.5 m³" in a column should line up.
  const decimals = unit === 'm3' ? 1 : 0
  return `${formatThousandths(thousandths, decimals)} ${formatUnit(unit, thousandths)}`
}
