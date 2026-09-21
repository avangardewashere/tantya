import {
  CHB_BLOCKS_PER_M2,
  concreteCementKey,
  concreteGravelKey,
  concreteSandKey,
  factorFromDecimal,
  mortarCementKey,
  mortarSandKey,
  unverifiedFactors,
  type Factor,
  type FactorTable,
} from './factors'
import {
  CHB_THICKNESSES,
  CONCRETE_CLASSES,
  MORTAR_CLASSES,
  concreteClass,
  mortarClass,
  type ChbThickness,
} from './classes'

/**
 * The production factor table — **PLACEHOLDER VALUES, NOTHING VERIFIED.**
 *
 * Every factor here has `verifiedOn: null`, which is the truth: not one of
 * them has been checked against a reference book, because the book has not
 * been chosen yet. Phase 4 of Block 1 replaces the values and the sources
 * with real ones and fills in the dates.
 *
 * It exists now so the form has a table to default to, and so the
 * "unverified" chip has real work to do rather than being decoration. Until
 * phase 4, **every line in the app carries a chip**, `docs/factors.md` is
 * empty, and `npm run test:release` (also phase 4) will refuse to pass.
 *
 * The one number here that is not really in doubt is 12.5 blocks per m²,
 * which falls straight out of a 400 × 200 mm block face. The rest are
 * plausible shapes with no authority behind them, and must not be used to
 * price real work.
 */

const PLACEHOLDER_SOURCE =
  'PLACEHOLDER — not yet checked against any reference. Replace in Block 1, phase 4.'

const MORTAR_CEMENT: Readonly<Record<ChbThickness, Readonly<Record<string, string>>>> = {
  100: { A: '0.792', B: '0.633', C: '0.528', D: '0.396' },
  125: { A: '0.900', B: '0.720', C: '0.600', D: '0.450' },
  150: { A: '1.018', B: '0.814', C: '0.679', D: '0.509' },
  200: { A: '1.300', B: '1.040', C: '0.867', D: '0.650' },
}

const MORTAR_SAND: Readonly<Record<ChbThickness, string>> = {
  100: '0.044',
  125: '0.050',
  150: '0.058',
  200: '0.074',
}

const CONCRETE_MIX: Readonly<Record<string, { cement: string; sand: string; gravel: string }>> =
  {
    AA: { cement: '12.0', sand: '0.5', gravel: '1.0' },
    A: { cement: '9.0', sand: '0.5', gravel: '1.0' },
    B: { cement: '7.5', sand: '0.5', gravel: '1.0' },
    C: { cement: '6.0', sand: '0.5', gravel: '1.0' },
  }

function build(): Readonly<Record<string, Factor>> {
  const factors: Record<string, Factor> = {}
  const unchecked = null

  factors[CHB_BLOCKS_PER_M2] = factorFromDecimal(
    CHB_BLOCKS_PER_M2,
    '12.5',
    'pcs/m²',
    'net',
    PLACEHOLDER_SOURCE,
    unchecked,
  )

  for (const thickness of CHB_THICKNESSES) {
    for (const letter of MORTAR_CLASSES) {
      const mortar = mortarClass(letter)

      const cementKey = mortarCementKey(thickness, mortar)
      factors[cementKey] = factorFromDecimal(
        cementKey,
        MORTAR_CEMENT[thickness][letter],
        'bags/m²',
        'net',
        PLACEHOLDER_SOURCE,
        unchecked,
      )

      const sandKey = mortarSandKey(thickness, mortar)
      factors[sandKey] = factorFromDecimal(
        sandKey,
        MORTAR_SAND[thickness],
        'm³/m²',
        'net',
        PLACEHOLDER_SOURCE,
        unchecked,
      )
    }
  }

  for (const letter of CONCRETE_CLASSES) {
    const concrete = concreteClass(letter)
    const mix = CONCRETE_MIX[letter]

    for (const [key, value, unit] of [
      [concreteCementKey(concrete), mix.cement, 'bags/m³'],
      [concreteSandKey(concrete), mix.sand, 'm³/m³'],
      [concreteGravelKey(concrete), mix.gravel, 'm³/m³'],
    ] as const) {
      factors[key] = factorFromDecimal(key, value, unit, 'net', PLACEHOLDER_SOURCE, unchecked)
    }
  }

  return Object.freeze(factors)
}

export const PRODUCTION_FACTORS: FactorTable = Object.freeze({
  id: 'production-placeholder',
  description:
    'Placeholder factors. Nothing here has been checked against a reference book.',
  factors: build(),
})

/**
 * True while not one factor has been verified — which is the state the app
 * ships in until phase 4. The page reads this rather than being told, so the
 * warning cannot be left up after the table is real, or taken down before.
 */
export const everyFactorIsUnverified = (table: FactorTable = PRODUCTION_FACTORS): boolean =>
  unverifiedFactors(table).length === Object.keys(table.factors).length
