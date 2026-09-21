import { chbWall } from './chb-wall'
import { concrete } from './concrete'
import type { FactorTable } from './factors'
import { ZERO, add, ceilToThousandths, type Fraction } from './fraction'
import { getMaterial, materialOrder, type MaterialId } from './materials'
import { roundUpToStep } from './round'
import { ok, type Result } from './result'
import type {
  CalculationError,
  MaterialNeed,
  PurchaseLine,
  WorkItem,
} from './work-items'

/**
 * Needs in, shopping list out.
 *
 * **This is the only place in Tantya a quantity is ever rounded**, and it
 * rounds in one direction, once, after everything has been added together.
 *
 * Get the order wrong and the estimate silently overcharges. Two class B
 * columns need 1.4765625 and 1.5234375 bags of cement. Added first: exactly
 * 3 bags. Rounded first: 2 + 2 = 4. A whole bag bought for nothing, on a
 * two-column job, and nothing on the page looks wrong.
 */

/** Every kind of work item, dispatched. */
export function calculateNeeds(
  item: WorkItem,
  factors: FactorTable,
): Result<readonly MaterialNeed[], CalculationError> {
  switch (item.kind) {
    case 'chbWall':
      return chbWall(item, factors)
    case 'concrete':
      return concrete(item, factors)
    default:
      return unhandled(item)
  }
}

/**
 * Makes TypeScript list every switch that has not been updated when Block 2
 * adds `custom` and Block 5 adds `rebar`. If this line ever stops compiling,
 * that is the type system doing its job, not an obstacle.
 */
function unhandled(item: never): never {
  throw new Error(
    `Unhandled work item kind: ${JSON.stringify(item)}. ` +
      `Add a case to calculateNeeds in src/engine/purchase-lines.ts.`,
  )
}

export function toPurchaseLines(
  needs: readonly MaterialNeed[],
  // Taken as an argument rather than imported so a test can hand in a
  // catalogue with different purchase steps — "ask your supplier" is a real
  // setting, not a constant.
  purchaseStepFor: (material: MaterialId) => number = (material) =>
    getMaterial(material).purchaseStepThousandths,
): readonly PurchaseLine[] {
  const merged = new Map<
    MaterialId,
    {
      exact: Fraction
      feeds: string[]
      workings: string[]
      unverifiedFactor: boolean
    }
  >()

  for (const need of needs) {
    const existing = merged.get(need.material)
    if (existing) {
      // Added exactly. This addition is the reason MaterialNeed carries a
      // Fraction and not a number.
      existing.exact = add(existing.exact, need.quantity)
      if (!existing.feeds.includes(need.fromItemId)) existing.feeds.push(need.fromItemId)
      existing.workings.push(need.because)
      existing.unverifiedFactor ||= need.unverifiedFactor
    } else {
      merged.set(need.material, {
        exact: add(ZERO, need.quantity),
        feeds: [need.fromItemId],
        workings: [need.because],
        unverifiedFactor: need.unverifiedFactor,
      })
    }
  }

  return [...merged.entries()]
    .map(([material, line]) => ({
      material,
      // The one rounding: exact total up to whole thousandths, then up to
      // what the store sells. Both round up, and the step is always a whole
      // number of thousandths, so the two together land where rounding up
      // once to the step would.
      quantityThousandths: roundUpToStep(
        ceilToThousandths(line.exact),
        purchaseStepFor(material),
      ),
      exactQuantity: line.exact,
      feeds: line.feeds,
      workings: line.workings,
      unverifiedFactor: line.unverifiedFactor,
    }))
    .sort((a, b) => materialOrder(a.material) - materialOrder(b.material))
}

/**
 * Every item on an estimate, into one shopping list.
 *
 * Block 2 builds the estimate sheet on top of this. It is here in Block 1 so
 * that "adds before it rounds" is proved on real work items, not just on the
 * ruler, before anything depends on it.
 */
export function consolidate(
  items: readonly WorkItem[],
  factors: FactorTable,
): Result<readonly PurchaseLine[], CalculationError> {
  const allNeeds: MaterialNeed[] = []

  for (const item of items) {
    const result = calculateNeeds(item, factors)
    if (!result.ok) return result
    allNeeds.push(...result.value)
  }

  return ok(toPurchaseLines(allNeeds))
}
