/**
 * @jest-environment node
 *
 * B0-T5 · `roundUpToStep`, and B0-T6 · the float trap at the ruler.
 */
import { roundUpToStep } from '../round'
import {
  ceilToThousandths,
  fraction,
  fromInteger,
  multiply,
  toDecimalString,
} from '../fraction'

describe('B0-T5 roundUpToStep works on whole numbers only', () => {
  test.each([
    // [quantity, step, expected, what it means]
    [2260, 500, 2500, '2.26 m³ at a half-cubic-metre step is 2.5 m³'],
    [2500, 500, 2500, 'an exact multiple stays put'],
    [0, 500, 0, 'nothing needed, nothing bought'],
    [1, 500, 500, 'the smallest need still costs a whole step'],
    [77625, 1000, 78000, '77.625 blocks is 78 pieces'],
    [13500, 1000, 14000, '13.5 bags is 14 bags'],
  ])('%p at a step of %p is %p — %s', (quantity, step, expected) => {
    expect(roundUpToStep(quantity, step)).toBe(expected)
  })

  it('throws on a negative quantity, rather than inventing an order', () => {
    expect(() => roundUpToStep(-1, 500)).toThrow(RangeError)
    expect(() => roundUpToStep(-1, 500)).toThrow(/never negative|not round a negative/i)
  })

  it('throws on a step of zero', () => {
    expect(() => roundUpToStep(1000, 0)).toThrow(RangeError)
    expect(() => roundUpToStep(1000, -500)).toThrow(RangeError)
  })

  it('throws rather than accept a fraction it would have to round twice', () => {
    expect(() => roundUpToStep(2260.5, 500)).toThrow(/whole numbers only/i)
    expect(() => roundUpToStep(2260, 0.5)).toThrow(/whole numbers only/i)
  })

  it('records the float version that does not work', () => {
    // Rounding up by dividing: two float errors, pulling opposite ways.
    expect(0.7 / 0.1).toBe(6.999999999999999)
    expect(Math.ceil(0.7 / 0.1) * 0.1).toBe(0.7000000000000001)

    // Whole numbers: 700 thousandths at a step of 100 is already on a step.
    expect(roundUpToStep(700, 100)).toBe(700)
  })
})

describe('B0-T6 the float trap, at the ruler', () => {
  it('shows the sum that floats get wrong', () => {
    expect(0.1 * 3).toBe(0.30000000000000004)
    expect(0.1 * 3 * 10).toBe(3.0000000000000004)
    expect(0.1 * 3 * 10).not.toBe(3)

    // And the consequence, one step further on: nine bags of cement per cubic
    // metre of that volume is 27 exactly, but the float rounds up to 28.
    expect(Math.ceil(0.1 * 3 * 10 * 9)).toBe(28)
  })

  it('does the same sum exactly in whole millimetres', () => {
    // A 3 m × 10 m slab, 100 mm thick, in millimetres.
    const volumeInCubicMillimetres = 3000n * 10000n * 100n
    expect(volumeInCubicMillimetres).toBe(3_000_000_000n)

    // One cubic metre is 1000 mm cubed.
    const cubicMetres = fraction(volumeInCubicMillimetres, 1000n ** 3n)
    expect(toDecimalString(cubicMetres, 3)).toBe('3.000')

    // Nine bags per cubic metre: 27 bags, and not a bag more.
    const bags = multiply(cubicMetres, fromInteger(9))
    expect(ceilToThousandths(bags)).toBe(27_000)
    expect(toDecimalString(bags, 2)).toBe('27.00')
  })

  it('stays exact past where a plain number stops being exact', () => {
    // mm³ × a factor in millionths × a wastage in basis points is already
    // past 9 × 10^15, where whole numbers are no longer held exactly.
    const huge = 3_000_000_000n * 1_000_000n * 10_000n
    expect(huge > BigInt(Number.MAX_SAFE_INTEGER)).toBe(true)
    expect(huge).toBe(30_000_000_000_000_000_000n)

    // The same sum as a plain number loses its last digits.
    expect(Number(huge) === 3e19).toBe(true)
    expect(Number.isSafeInteger(Number(huge))).toBe(false)
  })
})

describe('the fraction type keeps a need exact until the purchase line', () => {
  test.each([
    [fraction(101250n, 1000n), 2, '101.25'],
    [fraction(77625n, 1000n), 3, '77.625'],
    [fraction(1n, 2n), 0, '1'],
    [fraction(1n, 3n), 4, '0.3333'],
    [fraction(2n, 3n), 4, '0.6667'],
  ])('toDecimalString(%p, %p) is %p', (value, places, expected) => {
    expect(toDecimalString(value, places)).toBe(expected)
  })

  test.each([
    [fraction(1n, 3n), 334],
    [fraction(101250n, 1000n), 101250],
    [fraction(0n, 1n), 0],
  ])('ceilToThousandths(%p) is %p', (value, expected) => {
    expect(ceilToThousandths(value)).toBe(expected)
  })

  it('adds before it rounds, which is the whole point', () => {
    // The Block 2 case, proved at the ruler: needs of 5.2 and 8.6 bags are
    // 14 bags together, not 6 + 9 = 15.
    const a = fraction(52n, 10n)
    const b = fraction(86n, 10n)

    const roundedTogether = roundUpToStep(
      ceilToThousandths({ n: a.n * b.d + b.n * a.d, d: a.d * b.d }),
      1000,
    )
    const roundedSeparately =
      roundUpToStep(ceilToThousandths(a), 1000) + roundUpToStep(ceilToThousandths(b), 1000)

    expect(roundedTogether).toBe(14_000)
    expect(roundedSeparately).toBe(15_000)
  })

  it('refuses a denominator of zero', () => {
    expect(() => fraction(1n, 0n)).toThrow(RangeError)
  })
})
