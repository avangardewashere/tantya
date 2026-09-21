/**
 * @jest-environment node
 *
 * B1-T2 · wall goldens · B1-T3 · thickness and openings.
 *
 * Every expected value comes from docs/worked-examples.md, worked in exact
 * rational arithmetic before this engine existed. None of them was read out
 * of the code's output, and none is edited to agree with it.
 */
import { FROZEN_TEST_FACTORS } from '../__fixtures__/frozen-factors'
import { chbWall } from '../chb-wall'
import { mortarClass, type ChbThickness } from '../classes'
import { toDecimalString } from '../fraction'
import { toPurchaseLines } from '../purchase-lines'
import { basisPoints, millimetres, type BasisPoints, type Millimetres } from '../units'
import type { ChbWallItem, MaterialNeed, Opening } from '../work-items'

const mm = (value: number): Millimetres => millimetres(value)

function wall(overrides: Partial<ChbWallItem> = {}): ChbWallItem {
  return {
    kind: 'chbWall',
    id: 'w1',
    label: 'Perimeter wall',
    wastage: basisPoints(0),
    length: mm(3000),
    height: mm(2700),
    thickness: 150,
    openings: [],
    mortarClass: mortarClass('A'),
    ...overrides,
  }
}

const door = (count = 1): Opening => ({
  label: 'Door',
  width: mm(900),
  height: mm(2100),
  count,
})

/** The needs, or a thrown failure naming the error — never a silent skip. */
function needsOf(item: ChbWallItem): readonly MaterialNeed[] {
  const result = chbWall(item, FROZEN_TEST_FACTORS)
  if (!result.ok) throw new Error(`expected needs, got ${result.error.code}`)
  return result.value
}

/** What you would actually buy, which is what the foreman cares about. */
function buy(item: ChbWallItem, material: string): number {
  const line = toPurchaseLines(needsOf(item)).find((l) => l.material === material)
  if (!line) throw new Error(`no purchase line for ${material}`)
  return line.quantityThousandths / 1000
}

describe('B1-T2 wall goldens', () => {
  it('a plain 3.0 × 2.7 m wall is exactly 101.25 blocks, so 102 pieces', () => {
    const [blocks] = needsOf(wall())

    expect(toDecimalString(blocks.quantity, 4)).toBe('101.2500')
    expect(buy(wall(), 'chb.150')).toBe(102)
  })

  it('one 0.9 × 2.1 m door takes it to exactly 77.625, so 78 pieces', () => {
    const withDoor = wall({ openings: [door()] })

    expect(toDecimalString(needsOf(withDoor)[0].quantity, 4)).toBe('77.6250')
    expect(buy(withDoor, 'chb.150')).toBe(78)
  })

  it('5% wastage applied BEFORE rounding is 106.3125, so 107 — not 108', () => {
    const withWastage = wall({ wastage: basisPoints(500) })

    expect(toDecimalString(needsOf(withWastage)[0].quantity, 4)).toBe('106.3125')
    expect(buy(withWastage, 'chb.150')).toBe(107)

    // The wrong order, recorded: round up first to 102, then add 5%, and
    // 107.1 rounds to 108. One block apart, and neither looks wrong.
    expect(Math.ceil(Math.ceil(101.25) * 1.05)).toBe(108)
  })

  it('shows its working, with the wastage spelled out', () => {
    expect(needsOf(wall({ openings: [door()] }))[0].because).toBe(
      '6.21 m² × 12.5 pcs/m² = 77.625',
    )
    expect(needsOf(wall({ wastage: basisPoints(500) }))[0].because).toBe(
      '8.1 m² × 12.5 pcs/m² = 101.25, + 5% wastage = 106.3125',
    )
  })
})

describe('B1-T3 thickness changes the mortar but never the block count', () => {
  test.each<[ChbThickness, number, number, number]>([
    // thickness, blocks, cement bags, sand m³
    [150, 102, 9, 0.5],
    [200, 102, 11, 1.0],
  ])('a %p mm wall needs %p blocks, %p bags and %p m³ of sand', (
    thickness,
    blocks,
    cement,
    sand,
  ) => {
    const item = wall({ thickness })

    expect(buy(item, `chb.${thickness}`)).toBe(blocks)
    expect(buy(item, 'cement.40kg')).toBe(cement)
    expect(buy(item, 'sand')).toBe(sand)
  })

  it('counts the same blocks at every thickness, as a different product', () => {
    const counts = ([100, 125, 150, 200] as const).map((thickness) => {
      const [blocks] = needsOf(wall({ thickness }))
      return { material: blocks.material, exact: toDecimalString(blocks.quantity, 4) }
    })

    expect(counts.map((c) => c.exact)).toEqual([
      '101.2500',
      '101.2500',
      '101.2500',
      '101.2500',
    ])
    // A 200 mm block is not a 150 mm block, so the material differs even
    // though the count does not.
    expect(counts.map((c) => c.material)).toEqual([
      'chb.100',
      'chb.125',
      'chb.150',
      'chb.200',
    ])
  })

  it('changes the mortar when only the mortar class changes', () => {
    const richer = buy(wall({ mortarClass: mortarClass('A') }), 'cement.40kg')
    const leaner = buy(wall({ mortarClass: mortarClass('D') }), 'cement.40kg')

    expect(richer).toBe(9)
    expect(leaner).toBe(5) // 8.1 × 0.509 = 4.1229
    expect(leaner).toBeLessThan(richer)
  })
})

describe('B1-T3 openings', () => {
  it('refuses openings bigger than the wall, by name, with no negative number', () => {
    const result = chbWall(
      wall({ openings: [{ width: mm(4000), height: mm(3000), count: 1 }] }),
      FROZEN_TEST_FACTORS,
    )

    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error.code).toBe('OPENINGS_EXCEED_WALL')
    expect(result.error.message).toMatch(/12\.00 m².*8\.10 m²/)
  })

  it('adds up several openings before deciding', () => {
    // Five doors of 1.89 m² are 9.45 m², more than the 8.1 m² wall, though
    // no single one comes close.
    const result = chbWall(wall({ openings: [door(5)] }), FROZEN_TEST_FACTORS)

    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error.code).toBe('OPENINGS_EXCEED_WALL')
  })

  it('allows an opening exactly the size of the wall, and needs nothing', () => {
    // A wall that is all door is not an error. Zero is the honest answer.
    const allDoor = wall({ openings: [{ width: mm(3000), height: mm(2700), count: 1 }] })

    for (const need of needsOf(allDoor)) {
      expect(toDecimalString(need.quantity, 4)).toBe('0.0000')
    }
    expect(toPurchaseLines(needsOf(allDoor)).every((l) => l.quantityThousandths === 0)).toBe(
      true,
    )
  })

  it('refuses an opening count that is not a whole number of openings', () => {
    for (const count of [0, -1, 1.5]) {
      const result = chbWall(
        wall({ openings: [{ width: mm(900), height: mm(2100), count }] }),
        FROZEN_TEST_FACTORS,
      )
      expect(result.ok).toBe(false)
      if (!result.ok) expect(result.error.code).toBe('NOT_POSITIVE')
    }
  })

  it('refuses more openings than a real wall has', () => {
    const many = Array.from({ length: 51 }, () => door())
    const result = chbWall(wall({ openings: many }), FROZEN_TEST_FACTORS)

    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error.code).toBe('TOO_MANY_OPENINGS')
  })
})

describe('B1-T7 the largest allowed wall', () => {
  it('stays exact at 1 km × 1 km', () => {
    const huge = wall({ length: mm(1_000_000), height: mm(1_000_000) })

    expect(buy(huge, 'chb.150')).toBe(12_500_000)
    expect(buy(huge, 'cement.40kg')).toBe(1_018_000)
    expect(buy(huge, 'sand')).toBe(58_000)
  })
})

describe('the unverified factor travels with the need', () => {
  it('marks the need whose factor has never been checked', () => {
    // Mortar sand at 150 mm class A is left unverified in the frozen table
    // on purpose, so the form has something to put a chip on.
    const needs = needsOf(wall())

    expect(needs.find((n) => n.material === 'sand')?.unverifiedFactor).toBe(true)
    expect(needs.find((n) => n.material === 'chb.150')?.unverifiedFactor).toBe(false)
  })

  it('carries the mark through to the purchase line', () => {
    const lines = toPurchaseLines(needsOf(wall()))

    expect(lines.find((l) => l.material === 'sand')?.unverifiedFactor).toBe(true)
    expect(lines.find((l) => l.material === 'cement.40kg')?.unverifiedFactor).toBe(false)
  })
})

describe('a factor that is missing is never treated as zero', () => {
  it('throws rather than dropping a material from the estimate', () => {
    const gutted = {
      ...FROZEN_TEST_FACTORS,
      factors: Object.fromEntries(
        Object.entries(FROZEN_TEST_FACTORS.factors).filter(
          ([key]) => key !== 'chb.blocks.per.m2',
        ),
      ),
    }

    expect(() => chbWall(wall(), gutted)).toThrow(/chb\.blocks\.per\.m2.*missing/s)
  })
})

/** Guards the branding: this must not compile if the classes ever merge. */
describe('a concrete class cannot be used as a mortar class', () => {
  it('is a compile-time guarantee, recorded here in prose', () => {
    // @ts-expect-error a ConcreteClass is not a MortarClass, even though both
    // have a member called 'A' and both are strings at runtime.
    const broken: ChbWallItem['mortarClass'] = 'A'

    expect(broken).toBe('A')
  })
})

export type { BasisPoints }
