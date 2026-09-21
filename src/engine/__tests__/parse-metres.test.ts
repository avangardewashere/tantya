/**
 * @jest-environment node
 *
 * B0-T4 · `parseMetres`.
 *
 * Expected values come from docs/worked-examples.md, worked out before this
 * file existed. They are never edited to agree with the code.
 */
import {
  MAX_LENGTH_MM,
  parseMetres,
  type MeasurementErrorCode,
} from '../parse-metres'

/** Unwrap a success, or fail the test with the error instead of a crash. */
function metres(text: string): number {
  const result = parseMetres(text)
  if (!result.ok) throw new Error(`expected "${text}" to parse, got ${result.error.code}`)
  return result.value
}

describe('B0-T4 parseMetres turns text into whole millimetres', () => {
  test.each([
    ['2.7', 2700],
    [' 3 ', 3000],
    ['1.005', 1005],
  ])('%p is %p mm', (text, expected) => {
    expect(metres(text)).toBe(expected)
  })

  it('does not lose the millimetre that the float version loses', () => {
    // The recorded counter-example. parseFloat('1.005') is a hair under
    // 1.005, so multiplying by 1000 lands just under 1005 and truncates away.
    expect(parseFloat('1.005') * 1000).toBe(1004.9999999999999)
    expect(Math.trunc(parseFloat('1.005') * 1000)).toBe(1004)

    expect(metres('1.005')).toBe(1005)
  })

  it('reads every decimal place down to the millimetre', () => {
    expect(metres('0.001')).toBe(1)
    expect(metres('2.70')).toBe(2700)
    expect(metres('2.700')).toBe(2700)
    expect(metres('10')).toBe(10000)
  })
})

describe('B0-T4 parseMetres refuses by name rather than guessing', () => {
  test.each<[string, MeasurementErrorCode]>([
    ['2,7', 'COMMA_DECIMAL'],
    ['3m', 'UNIT_SUFFIX'],
    ['10ft', 'IMPERIAL'],
    ['1e3', 'EXPONENT'],
    ['', 'EMPTY'],
    ['abc', 'NOT_A_NUMBER'],
    ['-1', 'NOT_POSITIVE'],
    ['0', 'NOT_POSITIVE'],
    ['2.7005', 'TOO_MANY_DECIMALS'],
  ])('%p is refused as %s', (text, code) => {
    const result = parseMetres(text)

    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error.code).toBe(code)
    // The message is shown to the person who typed it, so it must say
    // something, and must not leak a number they never asked for.
    expect(result.error.message.length).toBeGreaterThan(0)
  })

  it('never returns a rounded value in place of an error', () => {
    // The whole point of the refusals: a silent round here would be invisible
    // by the time it reached a bag count.
    for (const text of ['2.7005', '0.0001', '2,7', '10ft', '1e3']) {
      expect(parseMetres(text).ok).toBe(false)
    }
  })

  test.each([['  '], ['\t\n']])('whitespace only (%p) is EMPTY', (text) => {
    const result = parseMetres(text)
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error.code).toBe('EMPTY')
  })

  it('refuses a length past the largest one Tantya measures', () => {
    expect(metres('1000')).toBe(MAX_LENGTH_MM)

    const result = parseMetres('1000.001')
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error.code).toBe('TOO_LARGE')
  })

  it('calls a malformed number what it is, not a unit', () => {
    const result = parseMetres('2.7.5')
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error.code).toBe('NOT_A_NUMBER')
  })
})
