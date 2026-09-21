import {
  CHB_BLOCKS_PER_M2,
  getFactor,
  mortarCementKey,
  mortarSandKey,
  type Factor,
  type FactorTable,
} from './factors'
import { fraction, multiply, toDecimalString, type Fraction } from './fraction'
import { chbMaterialId } from './materials'
import { err, ok, type Result } from './result'
import { ONE_HUNDRED_PERCENT_BP, ONE_MILLIONTH_UNIT } from './units'
import {
  MAX_OPENINGS,
  type CalculationError,
  type ChbWallItem,
  type MaterialNeed,
} from './work-items'

/**
 * A hollow-block wall: how many blocks, and how much mortar.
 *
 * Returns **exact needs only**. Nothing here rounds — not the area, not the
 * block count, not the cement. Rounding happens once, later, in
 * `toPurchaseLines`, because a need rounded here would be rounded again when
 * it met the needs of every other wall on the estimate.
 */

const SQUARE_MILLIMETRES_PER_SQUARE_METRE = 1_000_000n

/** Wastage as an exact multiplier: 5% (500 bp) is 10500/10000. */
export const wastageMultiplier = (basisPoints: number): Fraction =>
  fraction(
    BigInt(ONE_HUNDRED_PERCENT_BP + basisPoints),
    BigInt(ONE_HUNDRED_PERCENT_BP),
  )

/** A factor as an exact fraction: 12.5 pcs/m² is 12500000/1000000. */
export const factorAsFraction = (factor: Factor): Fraction =>
  fraction(BigInt(factor.value), BigInt(ONE_MILLIONTH_UNIT))

/**
 * The show-your-work line. This is a trust feature, not decoration: it is how
 * a foreman standing at a counter decides whether to believe the number.
 */
export function working(
  quantityDescription: string,
  factor: Factor,
  product: Fraction,
  wastageBasisPoints: number,
  withWastage: Fraction,
): string {
  const base = `${quantityDescription} × ${toDecimalString(factorAsFraction(factor), 4).replace(/\.?0+$/, '')} ${factor.unit} = ${toDecimalString(product, 4).replace(/\.?0+$/, '')}`

  if (wastageBasisPoints === 0) return base

  const percent = toDecimalString(
    fraction(BigInt(wastageBasisPoints), 100n),
    2,
  ).replace(/\.?0+$/, '')

  return `${base}, + ${percent}% wastage = ${toDecimalString(withWastage, 4).replace(/\.?0+$/, '')}`
}

export function chbWall(
  item: ChbWallItem,
  factors: FactorTable,
): Result<readonly MaterialNeed[], CalculationError> {
  if (item.openings.length > MAX_OPENINGS) {
    return err({
      code: 'TOO_MANY_OPENINGS',
      message: `A wall can have at most ${MAX_OPENINGS} openings. Split it into two walls.`,
    })
  }

  for (const opening of item.openings) {
    if (!Number.isInteger(opening.count) || opening.count < 1) {
      return err({
        code: 'NOT_POSITIVE',
        message: `An opening's count must be a whole number, 1 or more. Remove the row instead of setting it to ${opening.count}.`,
      })
    }
  }

  const grossAreaMm2 = BigInt(item.length) * BigInt(item.height)

  const openingAreaMm2 = item.openings.reduce(
    (total, opening) =>
      total + BigInt(opening.width) * BigInt(opening.height) * BigInt(opening.count),
    0n,
  )

  if (openingAreaMm2 > grossAreaMm2) {
    return err({
      code: 'OPENINGS_EXCEED_WALL',
      message:
        `The openings add up to more than the wall itself ` +
        `(${toDecimalString(fraction(openingAreaMm2, SQUARE_MILLIMETRES_PER_SQUARE_METRE), 2)} m² ` +
        `of a ${toDecimalString(fraction(grossAreaMm2, SQUARE_MILLIMETRES_PER_SQUARE_METRE), 2)} m² wall). ` +
        `Check the opening sizes, or the wall's own measurements.`,
    })
  }

  // An opening exactly the size of the wall is not an error: it is a wall
  // that is all door, and it needs nothing. Zero is the honest answer.
  const netAreaM2 = fraction(
    grossAreaMm2 - openingAreaMm2,
    SQUARE_MILLIMETRES_PER_SQUARE_METRE,
  )

  const wastage = wastageMultiplier(item.wastage)
  const areaLabel = `${toDecimalString(netAreaM2, 4).replace(/\.?0+$/, '')} m²`

  const need = (materialFactor: Factor, materialId: ReturnType<typeof chbMaterialId>) => {
    const product = multiply(netAreaM2, factorAsFraction(materialFactor))
    const quantity = multiply(product, wastage)
    return {
      material: materialId,
      quantity,
      because: working(areaLabel, materialFactor, product, item.wastage, quantity),
      fromItemId: item.id,
      unverifiedFactor: materialFactor.verifiedOn === null,
    }
  }

  const blocks = getFactor(factors, CHB_BLOCKS_PER_M2)
  const cement = getFactor(factors, mortarCementKey(item.thickness, item.mortarClass))
  const sand = getFactor(factors, mortarSandKey(item.thickness, item.mortarClass))

  return ok([
    need(blocks, chbMaterialId(item.thickness)),
    need(cement, 'cement.40kg'),
    need(sand, 'sand'),
  ])
}
