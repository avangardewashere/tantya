/**
 * @jest-environment node
 *
 * B1-T5 · `toPurchaseLines` adds before it rounds.
 *
 * This is the row the whole architecture exists for. Everything upstream
 * stays an exact fraction so that this one place can round, once, after the
 * adding is done.
 */
import { FROZEN_TEST_FACTORS } from '../__fixtures__/frozen-factors'
import { concreteClass, mortarClass } from '../classes'
import { add, toDecimalString } from '../fraction'
import { calculateNeeds, consolidate, toPurchaseLines } from '../purchase-lines'
import { basisPoints, millimetres, type Millimetres } from '../units'
import type { ConcreteItem, MaterialNeed, WorkItem } from '../work-items'

const mm = (value: number): Millimetres => millimetres(value)

function column(id: string, heightMm: number): ConcreteItem {
  return {
    kind: 'concrete',
    id,
    label: `Column ${id}`,
    wastage: basisPoints(0),
    shape: 'column',
    length: mm(250),
    width: mm(250),
    depth: mm(heightMm),
    count: 1,
    concreteClass: concreteClass('B'),
  }
}

function needsOf(item: WorkItem): readonly MaterialNeed[] {
  const result = calculateNeeds(item, FROZEN_TEST_FACTORS)
  if (!result.ok) throw new Error(`expected needs, got ${result.error.code}`)
  return result.value
}

const bought = (lines: readonly { material: string; quantityThousandths: number }[], id: string) =>
  (lines.find((l) => l.material === id)?.quantityThousandths ?? 0) / 1000

describe('B1-T5 two class B columns need exactly 3 bags, not 4', () => {
  const columns = [column('a', 3150), column('b', 3250)]
  const needs = columns.flatMap(needsOf)

  it('needs 1.4765625 and 1.5234375 bags, which add to exactly 3', () => {
    const [first, second] = columns.map((c) => needsOf(c)[0].quantity)

    // The volumes are 0.196875 and 0.203125 m³, adding to exactly 0.4 — a
    // sum that would not land clean in floating point. At 7.5 bags per m³
    // that is 1.4765625 and 1.5234375 bags, and 3 exactly together.
    expect(toDecimalString(first, 7)).toBe('1.4765625')
    expect(toDecimalString(second, 7)).toBe('1.5234375')
    expect(toDecimalString(add(first, second), 7)).toBe('3.0000000')
  })

  it('buys 3 bags when the needs are added first', () => {
    const lines = toPurchaseLines(needs)
    const cement = lines.find((l) => l.material === 'cement.40kg')!

    expect(toDecimalString(cement.exactQuantity, 6)).toBe('3.000000')
    expect(bought(lines, 'cement.40kg')).toBe(3)
  })

  it('would buy 4 bags if each need were rounded on its own', () => {
    // The mistake, made deliberately and measured: 1.4765625 → 2 and
    // 1.5234375 → 2. A whole bag bought for nothing, on a two-column job,
    // with nothing on the page looking wrong.
    const separately = columns
      .map((c) => bought(toPurchaseLines(needsOf(c)), 'cement.40kg'))
      .reduce((a, b) => a + b, 0)

    expect(separately).toBe(4)
    expect(separately).toBeGreaterThan(bought(toPurchaseLines(needs), 'cement.40kg'))
  })

  it('records which items fed the line, and both workings', () => {
    const cement = toPurchaseLines(needs).find((l) => l.material === 'cement.40kg')!

    expect(cement.feeds).toEqual(['a', 'b'])
    expect(cement.workings).toHaveLength(2)
  })
})

describe('B1-T5 merging', () => {
  it('merges the same material from different kinds of work', () => {
    const wall: WorkItem = {
      kind: 'chbWall',
      id: 'w1',
      label: 'Wall',
      wastage: basisPoints(0),
      length: mm(3000),
      height: mm(2700),
      thickness: 150,
      openings: [],
      mortarClass: mortarClass('A'),
    }

    const lines = toPurchaseLines([...needsOf(wall), ...needsOf(column('c', 3150))])
    const cement = lines.find((l) => l.material === 'cement.40kg')!

    // One cement row, fed by both, not two rows that each round up.
    expect(lines.filter((l) => l.material === 'cement.40kg')).toHaveLength(1)
    expect(cement.feeds).toEqual(['w1', 'c'])
  })

  it('keeps different materials apart', () => {
    const lines = toPurchaseLines(needsOf(column('a', 3150)))

    expect(lines.map((l) => l.material)).toEqual(['cement.40kg', 'sand', 'gravel'])
  })

  it('lists lines in catalogue order, whatever order the needs arrive in', () => {
    const forwards = toPurchaseLines(needsOf(column('a', 3150)))
    const backwards = toPurchaseLines([...needsOf(column('a', 3150))].reverse())

    expect(backwards.map((l) => l.material)).toEqual(forwards.map((l) => l.material))
  })

  it('gives no lines at all for no needs', () => {
    expect(toPurchaseLines([])).toEqual([])
  })

  it('takes the purchase step as an argument, because suppliers differ', () => {
    // "Ask your supplier" is a real setting, not a constant: some sell sand
    // by the whole cubic metre.
    const needs = needsOf(column('a', 3150))
    const wholeCubicMetres = toPurchaseLines(needs, (material) =>
      material === 'sand' ? 1000 : 500,
    )

    // 0.196875 × 0.5 = 0.0984375 m³ of sand: half a metre at the usual step,
    // a whole one from a supplier who will not split.
    expect(bought(toPurchaseLines(needs), 'sand')).toBe(0.5)
    expect(bought(wholeCubicMetres, 'sand')).toBe(1)
  })
})

describe('consolidate runs every item through the same rounding', () => {
  it('gives one shopping list for the whole estimate', () => {
    const result = consolidate([column('a', 3150), column('b', 3250)], FROZEN_TEST_FACTORS)

    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(bought(result.value, 'cement.40kg')).toBe(3)
  })

  it('stops at the first item that cannot be calculated, and says which error', () => {
    const impossible: ConcreteItem = { ...column('bad', 3150), count: 0 }
    const result = consolidate([column('a', 3150), impossible], FROZEN_TEST_FACTORS)

    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error.code).toBe('COUNT_OUT_OF_RANGE')
  })

  it('gives an empty list for an empty estimate', () => {
    const result = consolidate([], FROZEN_TEST_FACTORS)

    expect(result.ok).toBe(true)
    if (result.ok) expect(result.value).toEqual([])
  })
})

describe('the dispatch is exhaustive', () => {
  it('throws, loudly, on a kind it has never heard of', () => {
    // Block 2 adds `custom` and Block 5 adds `rebar`. TypeScript will refuse
    // to compile the switch until each is handled; this is the runtime
    // backstop for anything that reaches the engine another way.
    const alien = { kind: 'rebar', id: 'r1' } as unknown as WorkItem

    expect(() => calculateNeeds(alien, FROZEN_TEST_FACTORS)).toThrow(
      /Unhandled work item kind/,
    )
  })
})
