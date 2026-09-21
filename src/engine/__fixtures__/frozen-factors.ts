import {
  CHB_BLOCKS_PER_M2,
  concreteCementKey,
  concreteGravelKey,
  concreteSandKey,
  factorFromDecimal,
  mortarCementKey,
  mortarSandKey,
  type Factor,
  type FactorTable,
} from '../factors'
import {
  CHB_THICKNESSES,
  CONCRETE_CLASSES,
  MORTAR_CLASSES,
  concreteClass,
  mortarClass,
  type ChbThickness,
} from '../classes'

/**
 * THE FROZEN TEST TABLE. NOT REAL FACTORS. NEVER SHIPPED.
 *
 * Invented round numbers, chosen so every expected value in the suite can be
 * checked on paper. Two rules keep it useful:
 *
 *   1. **It never changes.** Correcting a real factor in the production table
 *      must never turn a test red. If a frozen value changed, every golden
 *      would have to be re-worked by hand, and in practice they would instead
 *      be quietly updated to whatever the code now prints — which is exactly
 *      the failure this whole arrangement exists to prevent.
 *
 *   2. **One factor is left unverified on purpose** (mortar sand, 150 mm,
 *      class A). Without it there would be nothing to render the "unverified"
 *      chip against, and the chip would ship untested.
 *
 * The workings that use these values are in docs/worked-examples.md.
 */

const SOURCE = 'Frozen test table — invented values, not a real reference'
const CHECKED = '2026-09-21'

/**
 * Mortar cement, bags per m² of wall face, by thickness and mortar class.
 *
 * Keyed by the bare letter, not by `MortarClass`: the brand that stops a
 * concrete class being passed as a mortar class also stops the branded type
 * being used as an index. That is the brand doing its job, so the lookup
 * table takes the letter and the caller does the branding.
 */
type MortarLetter = (typeof MORTAR_CLASSES)[number]

const MORTAR_CEMENT: Readonly<Record<ChbThickness, Readonly<Record<MortarLetter, string>>>> = {
  100: { A: '0.792', B: '0.633', C: '0.528', D: '0.396' },
  125: { A: '0.900', B: '0.720', C: '0.600', D: '0.450' },
  150: { A: '1.018', B: '0.814', C: '0.679', D: '0.509' },
  200: { A: '1.300', B: '1.040', C: '0.867', D: '0.650' },
}

/**
 * Mortar sand, m³ per m² of wall face. In the frozen table this depends only
 * on thickness: the volume of mortar is set by how thick the wall is, and the
 * class decides how much of that volume is cement. Real tables vary the sand
 * a little by class too; this one does not, on purpose, so the arithmetic
 * stays checkable.
 */
const MORTAR_SAND: Readonly<Record<ChbThickness, string>> = {
  100: '0.044',
  125: '0.050',
  150: '0.058',
  200: '0.074',
}

/** Per m³ of concrete: cement bags, sand m³, gravel m³. */
const CONCRETE_MIX = {
  AA: { cement: '12.0', sand: '0.5', gravel: '1.0' },
  A: { cement: '9.0', sand: '0.5', gravel: '1.0' },
  B: { cement: '7.5', sand: '0.5', gravel: '1.0' },
  C: { cement: '6.0', sand: '0.5', gravel: '1.0' },
} as const

/** The one factor left unchecked, so the "unverified" chip has something to show. */
export const DELIBERATELY_UNVERIFIED_KEY = mortarSandKey(150, mortarClass('A'))

function build(): Readonly<Record<string, Factor>> {
  const factors: Record<string, Factor> = {}

  factors[CHB_BLOCKS_PER_M2] = factorFromDecimal(
    CHB_BLOCKS_PER_M2,
    '12.5',
    'pcs/m²',
    'net',
    SOURCE,
    CHECKED,
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
        SOURCE,
        CHECKED,
      )

      const sandKey = mortarSandKey(thickness, mortar)
      factors[sandKey] = factorFromDecimal(
        sandKey,
        MORTAR_SAND[thickness],
        'm³/m²',
        'net',
        SOURCE,
        sandKey === DELIBERATELY_UNVERIFIED_KEY ? null : CHECKED,
      )
    }
  }

  for (const letter of CONCRETE_CLASSES) {
    const concrete = concreteClass(letter)
    const mix = CONCRETE_MIX[letter]

    const cementKey = concreteCementKey(concrete)
    factors[cementKey] = factorFromDecimal(
      cementKey,
      mix.cement,
      'bags/m³',
      'net',
      SOURCE,
      CHECKED,
    )

    const sandKey = concreteSandKey(concrete)
    factors[sandKey] = factorFromDecimal(sandKey, mix.sand, 'm³/m³', 'net', SOURCE, CHECKED)

    const gravelKey = concreteGravelKey(concrete)
    factors[gravelKey] = factorFromDecimal(
      gravelKey,
      mix.gravel,
      'm³/m³',
      'net',
      SOURCE,
      CHECKED,
    )
  }

  return Object.freeze(factors)
}

export const FROZEN_TEST_FACTORS: FactorTable = Object.freeze({
  id: 'frozen-test-v1',
  description: 'Invented values for tests. Never shipped, and never changed.',
  factors: build(),
})
