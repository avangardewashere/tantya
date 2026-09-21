import type { ChbThickness } from './classes'
import { CHB_NOMINAL_INCHES, CHB_THICKNESSES } from './classes'
import { ONE_THOUSANDTH_UNIT } from './units'

/**
 * What a hardware store actually sells, and in what lumps.
 *
 * The **purchase step** is the whole point of this file: a store sells one
 * bag, one piece, or half a cubic metre of sand. A need of 0.75 m³ is an
 * order of 1.0 m³, and pretending otherwise is how an estimate comes up short
 * on delivery day.
 *
 * No prices here. Prices arrive in Block 2, where they can be labelled as
 * samples, dated, and overridden per estimate.
 */

export type Unit = 'pc' | 'bag' | 'm3' | 'kg' | 'can' | 'lot'

export type MaterialId =
  | 'chb.100'
  | 'chb.125'
  | 'chb.150'
  | 'chb.200'
  | 'cement.40kg'
  | 'sand'
  | 'gravel'

export type Material = {
  readonly id: MaterialId
  readonly name: string
  readonly unit: Unit
  /**
   * The smallest amount the store sells, in thousandths of the unit.
   * 1 bag is 1000; half a cubic metre is 500.
   */
  readonly purchaseStepThousandths: number
}

const chb = (thickness: ChbThickness): Material => ({
  id: `chb.${thickness}` as MaterialId,
  name: `CHB ${thickness} mm (${CHB_NOMINAL_INCHES[thickness]})`,
  unit: 'pc',
  purchaseStepThousandths: ONE_THOUSANDTH_UNIT,
})

/**
 * The catalogue, in the order purchase lines are listed: blocks first, then
 * cement, then aggregates — the order a foreman reads a delivery note in.
 */
export const MATERIALS: readonly Material[] = [
  ...CHB_THICKNESSES.map(chb),
  {
    id: 'cement.40kg',
    name: 'Cement, 40 kg',
    unit: 'bag',
    purchaseStepThousandths: ONE_THOUSANDTH_UNIT,
  },
  {
    // Half a cubic metre because suppliers differ — some sell by the whole
    // cubic metre, some by truckload, some by sack. The step becomes a
    // setting labelled "ask your supplier"; half is the safe default.
    id: 'sand',
    name: 'Sand',
    unit: 'm3',
    purchaseStepThousandths: 500,
  },
  {
    id: 'gravel',
    name: 'Gravel',
    unit: 'm3',
    purchaseStepThousandths: 500,
  },
]

const BY_ID: ReadonlyMap<MaterialId, Material> = new Map(MATERIALS.map((m) => [m.id, m]))

/** The material's place in the catalogue, so purchase lines sort predictably. */
export const materialOrder = (id: MaterialId): number =>
  MATERIALS.findIndex((m) => m.id === id)

/**
 * A material by id. Throws: an unknown id is a bug in the engine, not
 * something a person typed.
 */
export function getMaterial(id: MaterialId): Material {
  const material = BY_ID.get(id)
  if (!material) {
    throw new Error(`No such material: "${id}". The catalogue is in src/engine/materials.ts.`)
  }
  return material
}

/** The CHB product for a wall of this thickness. A 200 mm block is not a 150 mm one. */
export const chbMaterialId = (thickness: ChbThickness): MaterialId =>
  `chb.${thickness}` as MaterialId
