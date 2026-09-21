import { factorAsFraction, wastageMultiplier, working } from './chb-wall'
import {
  concreteCementKey,
  concreteGravelKey,
  concreteSandKey,
  getFactor,
  type Factor,
  type FactorTable,
} from './factors'
import { fraction, multiply, toDecimalString } from './fraction'
import type { MaterialId } from './materials'
import { err, ok, type Result } from './result'
import {
  MAX_COUNT,
  type CalculationError,
  type ConcreteItem,
  type MaterialNeed,
} from './work-items'

/**
 * A concrete pour: cement, sand and gravel by class.
 *
 * A slab, a footing, a column and a beam are all length × width × depth ×
 * count. They are one calculation with four labels, not four calculations —
 * the shape changes what it is called on the estimate and nothing else.
 * Anything that would make them genuinely differ (bar spacing, formwork)
 * belongs to Block 5 or the Backlog, not here.
 *
 * Returns exact needs only. Nothing rounds until `toPurchaseLines`.
 */

const CUBIC_MILLIMETRES_PER_CUBIC_METRE = 1_000_000_000n

export function concrete(
  item: ConcreteItem,
  factors: FactorTable,
): Result<readonly MaterialNeed[], CalculationError> {
  if (!Number.isInteger(item.count) || item.count < 1 || item.count > MAX_COUNT) {
    return err({
      code: 'COUNT_OUT_OF_RANGE',
      message:
        `How many ${item.shape}s must be a whole number from 1 to ${MAX_COUNT}, not ${item.count}. ` +
        `For more than ${MAX_COUNT}, add a second item — the totals still add up.`,
    })
  }

  const volumeMm3 =
    BigInt(item.length) * BigInt(item.width) * BigInt(item.depth) * BigInt(item.count)

  const volumeM3 = fraction(volumeMm3, CUBIC_MILLIMETRES_PER_CUBIC_METRE)

  const wastage = wastageMultiplier(item.wastage)
  const volumeLabel = `${toDecimalString(volumeM3, 4).replace(/\.?0+$/, '')} m³`

  const need = (materialFactor: Factor, materialId: MaterialId): MaterialNeed => {
    const product = multiply(volumeM3, factorAsFraction(materialFactor))
    const quantity = multiply(product, wastage)
    return {
      material: materialId,
      quantity,
      because: working(volumeLabel, materialFactor, product, item.wastage, quantity),
      fromItemId: item.id,
      unverifiedFactor: materialFactor.verifiedOn === null,
    }
  }

  return ok([
    need(getFactor(factors, concreteCementKey(item.concreteClass)), 'cement.40kg'),
    need(getFactor(factors, concreteSandKey(item.concreteClass)), 'sand'),
    need(getFactor(factors, concreteGravelKey(item.concreteClass)), 'gravel'),
  ])
}
