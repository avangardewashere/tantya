import { MILLIMETRES_PER_METRE, type Millimetres } from './units'

/**
 * Turning what someone typed into a length.
 *
 * This is where the float trap is shut. `parseFloat('1.005') * 1000` is
 * 1004.9999999999999, which floors to 1004 mm: a millimetre lost before any
 * real sum has started. So the text is taken apart as text — whole part,
 * decimal part — and put back together with whole-number arithmetic.
 *
 * It never guesses. `'2,7'`, `'3m'`, `'10ft'` and `'1e3'` are all refused by
 * name rather than turned into some number the person did not mean. A wrong
 * answer here would look exactly like a right one further down.
 */

export type MeasurementErrorCode =
  | 'EMPTY'
  | 'NOT_A_NUMBER'
  | 'COMMA_DECIMAL'
  | 'UNIT_SUFFIX'
  | 'IMPERIAL'
  | 'EXPONENT'
  | 'TOO_MANY_DECIMALS'
  | 'NOT_POSITIVE'
  | 'TOO_LARGE'

export type MeasurementError = {
  readonly code: MeasurementErrorCode
  /** Shown to the person who typed it, so it says what to do next. */
  readonly message: string
}

export type ParseResult<T> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: MeasurementError }

/**
 * One kilometre. Longer than any wall Tantya is for, and short enough that a
 * slip of the finger on the keypad is caught rather than priced.
 */
export const MAX_LENGTH_MM = 1_000_000

/** At most three decimals, because a millimetre is the smallest length. */
export const MAX_DECIMAL_PLACES = 3

const PLAIN_DECIMAL = /^([+-]?)(\d+)(?:\.(\d+))?$/
const SCIENTIFIC = /^[+-]?(?:\d+\.?\d*|\.\d+)[eE][+-]?\d+$/
const IMPERIAL_SUFFIX = /^[+-]?[\d.,]+\s*(?:ft|foot|feet|in|inch|inches|yd|yard|yards|['"])$/i
const ANY_SUFFIX = /^[+-]?[\d.,]+\s*[a-z%°]+$/i

const fail = (code: MeasurementErrorCode, message: string): ParseResult<never> => ({
  ok: false,
  error: { code, message },
})

export function parseMetres(text: string): ParseResult<Millimetres> {
  const trimmed = text.trim()

  if (trimmed === '') {
    return fail('EMPTY', 'Type a measurement in metres.')
  }

  const match = PLAIN_DECIMAL.exec(trimmed)
  if (!match) return diagnose(trimmed)

  const [, sign, wholePart, decimalPart = ''] = match

  if (decimalPart.length > MAX_DECIMAL_PLACES) {
    return fail(
      'TOO_MANY_DECIMALS',
      `A measurement goes to ${MAX_DECIMAL_PLACES} decimal places, the nearest millimetre. ` +
        `Round "${trimmed}" yourself so the choice is yours, not Tantya's.`,
    )
  }

  // Whole millimetres, assembled from the digits. No multiplication by a
  // decimal ever happens, so there is nothing for a float to lose.
  const millimetres =
    BigInt(wholePart) * BigInt(MILLIMETRES_PER_METRE) +
    BigInt(decimalPart.padEnd(MAX_DECIMAL_PLACES, '0') || '0')

  if (sign === '-' || millimetres === 0n) {
    return fail('NOT_POSITIVE', 'A measurement must be more than zero.')
  }
  if (millimetres > BigInt(MAX_LENGTH_MM)) {
    return fail(
      'TOO_LARGE',
      `Tantya measures up to ${MAX_LENGTH_MM / MILLIMETRES_PER_METRE} m. Check the decimal point.`,
    )
  }

  return { ok: true, value: Number(millimetres) as Millimetres }
}

/** Why the text is not a plain decimal — said precisely, so it can be fixed. */
function diagnose(trimmed: string): ParseResult<never> {
  if (SCIENTIFIC.test(trimmed)) {
    return fail(
      'EXPONENT',
      `Type the measurement in full, in metres: 1000, not "${trimmed}".`,
    )
  }
  if (trimmed.includes(',')) {
    return fail(
      'COMMA_DECIMAL',
      `Use a full stop for the decimal point: 2.7, not "${trimmed}".`,
    )
  }
  if (IMPERIAL_SUFFIX.test(trimmed)) {
    return fail(
      'IMPERIAL',
      `Tantya works in metres. Convert "${trimmed}" yourself, so the conversion is one you checked.`,
    )
  }
  if (ANY_SUFFIX.test(trimmed)) {
    return fail('UNIT_SUFFIX', `Type the number only, in metres: 3, not "${trimmed}".`)
  }
  return fail('NOT_A_NUMBER', `"${trimmed}" is not a measurement. Type metres, such as 2.7.`)
}
