/**
 * @jest-environment node
 *
 * B1-T1 · the float trap in the engine · B1-T4 · concrete goldens ·
 * B1-T7 · the largest allowed inputs.
 *
 * Expected values come from docs/worked-examples.md, worked before the engine
 * existed.
 */
import { FROZEN_TEST_FACTORS } from '../__fixtures__/frozen-factors'
import { concreteClass, type ConcreteShape } from '../classes'
import { concrete } from '../concrete'
import { toDecimalString } from '../fraction'
import { parseMetres } from '../parse-metres'
import { toPurchaseLines } from '../purchase-lines'
import { basisPoints, millimetres, type Millimetres } from '../units'
import type { ConcreteItem, MaterialNeed } from '../work-items'

const mm = (value: number): Millimetres => millimetres(value)

/** Parse the way the form will, so the test exercises the whole path. */
function metres(text: string): Millimetres {
  const result = parseMetres(text)
  if (!result.ok) throw new Error(`"${text}" did not parse: ${result.error.code}`)
  return result.value
}

function pour(overrides: Partial<ConcreteItem> = {}): ConcreteItem {
  return {
    kind: 'concrete',
    id: 'c1',
    label: 'Footings',
    wastage: basisPoints(0),
    shape: 'footing',
    length: mm(1000),
    width: mm(1000),
    depth: mm(250),
    count: 6,
    concreteClass: concreteClass('A'),
    ...overrides,
  }
}

function needsOf(item: ConcreteItem): readonly MaterialNeed[] {
  const result = concrete(item, FROZEN_TEST_FACTORS)
  if (!result.ok) throw new Error(`expected needs, got ${result.error.code}`)
  return result.value
}

function buy(item: ConcreteItem, material: string): number {
  const line = toPurchaseLines(needsOf(item)).find((l) => l.material === material)
  if (!line) throw new Error(`no purchase line for ${material}`)
  return line.quantityThousandths / 1000
}

describe('B1-T1 the float trap, in the engine', () => {
  it('a 3 × 10 m slab 100 mm thick needs exactly 27 bags, not 28', () => {
    // Typed the way a person types it, and parsed the way the form parses it.
    const slab = pour({
      shape: 'slab',
      depth: metres('0.1'),
      length: metres('3'),
      width: metres('10'),
      count: 1,
      concreteClass: concreteClass('A'),
    })

    const [cement] = needsOf(slab)
    expect(toDecimalString(cement.quantity, 6)).toBe('27.000000')
    expect(buy(slab, 'cement.40kg')).toBe(27)
  })

  it('records the float version that gets it wrong', () => {
    // The same sum in floating point, one bag too many, with nothing on the
    // page to show for it.
    expect(0.1 * 3 * 10 * 9).toBe(27.000000000000004)
    expect(Math.ceil(0.1 * 3 * 10 * 9)).toBe(28)
  })

  it('is wrong in one multiplication order and right in another', () => {
    // Why the row above is not enough on its own. The same three numbers,
    // reordered, come out exact — so a float engine that happened to
    // multiply length × width × depth would pass the slab above by luck.
    expect(0.1 * 3 * 10).toBe(3.0000000000000004)
    expect(3 * 10 * 0.1).toBe(3)
  })

  it('a 10 × 10 m slab 70 mm thick is 63 bags in every order, and 64 in none', () => {
    // The hardened golden: 7 m³ × 9 bags/m³ = exactly 63. Here EVERY float
    // ordering overshoots, so no lucky arrangement of the same multiply can
    // sneak past this row — and the overshoot lands past a whole bag, so it
    // costs a real bag rather than vanishing at the purchase step.
    const slab = pour({
      shape: 'slab',
      length: metres('10'),
      width: metres('10'),
      depth: metres('0.07'),
      count: 1,
      concreteClass: concreteClass('A'),
    })

    expect(toDecimalString(needsOf(slab)[0].quantity, 6)).toBe('63.000000')
    expect(buy(slab, 'cement.40kg')).toBe(63)

    for (const asFloat of [10 * 10 * 0.07 * 9, 0.07 * 10 * 10 * 9, 10 * 0.07 * 10 * 9]) {
      expect(asFloat).toBe(63.00000000000001)
      expect(Math.ceil(asFloat)).toBe(64)
    }
  })
})

describe('B1-T4 concrete goldens: six 1.0 × 1.0 × 0.25 m footings, 1.5 m³', () => {
  test.each([
    // class, cement bags, sand m³, gravel m³
    ['AA', 18, 1.0, 1.5],
    ['A', 14, 1.0, 1.5],
    ['B', 12, 1.0, 1.5],
    ['C', 9, 1.0, 1.5],
  ] as const)('class %s needs %p bags, %p m³ sand, %p m³ gravel', (
    letter,
    cement,
    sand,
    gravel,
  ) => {
    const item = pour({ concreteClass: concreteClass(letter) })

    expect(buy(item, 'cement.40kg')).toBe(cement)
    expect(buy(item, 'sand')).toBe(sand)
    expect(buy(item, 'gravel')).toBe(gravel)
  })

  it('needs exactly 13.5 bags at class A, before anything is rounded', () => {
    const [cement] = needsOf(pour())

    // The exact need is 13.5. 14 is what you buy. Both are shown, because a
    // foreman checking the arithmetic needs the first and the counter needs
    // the second.
    expect(toDecimalString(cement.quantity, 4)).toBe('13.5000')
    expect(buy(pour(), 'cement.40kg')).toBe(14)
  })

  it('rounds 0.75 m³ of sand up to 1.0, because half a cubic metre is the step', () => {
    const sand = needsOf(pour()).find((n) => n.material === 'sand')

    expect(toDecimalString(sand!.quantity, 4)).toBe('0.7500')
    expect(buy(pour(), 'sand')).toBe(1.0)
  })

  test.each<ConcreteShape>(['slab', 'footing', 'column', 'beam'])(
    'a %s is the same calculation with a different label',
    (shape) => {
      expect(buy(pour({ shape }), 'cement.40kg')).toBe(14)
    },
  )

  it('shows its working', () => {
    expect(needsOf(pour())[0].because).toBe('1.5 m³ × 9 bags/m³ = 13.5')
  })
})

describe('B1-T4 count', () => {
  it('scales with the count', () => {
    expect(buy(pour({ count: 1 }), 'cement.40kg')).toBe(3) // 0.25 × 9 = 2.25
    expect(buy(pour({ count: 6 }), 'cement.40kg')).toBe(14)
  })

  test.each([0, -1, 2.5, 101])('refuses a count of %p by name', (count) => {
    const result = concrete(pour({ count }), FROZEN_TEST_FACTORS)

    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error.code).toBe('COUNT_OUT_OF_RANGE')
  })

  it('says what to do instead of just refusing', () => {
    const result = concrete(pour({ count: 500 }), FROZEN_TEST_FACTORS)

    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error.message).toMatch(/add a second item/i)
  })
})

describe('B1-T7 the largest allowed pour', () => {
  it('stays exact at 100 pours of a cubic kilometre', () => {
    // Absurd as a job, and exactly the point: the arithmetic has to hold at
    // the boundary, because the boundary is where a silent wrong answer
    // would live. 10^11 m³ × 12 bags/m³ = 1.2 × 10^12 bags.
    const huge = pour({
      length: mm(1_000_000),
      width: mm(1_000_000),
      depth: mm(1_000_000),
      count: 100,
      concreteClass: concreteClass('AA'),
    })

    expect(buy(huge, 'cement.40kg')).toBe(1_200_000_000_000)

    // In thousandths that is 1.2 × 10^15, still inside what a JavaScript
    // number holds exactly. One step further and it would not be.
    expect(1.2e15).toBeLessThan(Number.MAX_SAFE_INTEGER)
  })
})

describe('wastage applies to every material in the item', () => {
  it('raises cement, sand and gravel together', () => {
    const plain = pour()
    const wasteful = pour({ wastage: basisPoints(1000) }) // 10%

    // 13.5 × 1.1 = 14.85, so 15 bags rather than 14.
    expect(toDecimalString(needsOf(wasteful)[0].quantity, 4)).toBe('14.8500')
    expect(buy(wasteful, 'cement.40kg')).toBe(15)
    expect(buy(plain, 'cement.40kg')).toBe(14)

    // 1.5 × 1.1 = 1.65 m³ of gravel, up to 2.0 at the half-metre step.
    expect(buy(wasteful, 'gravel')).toBe(2.0)
  })
})
