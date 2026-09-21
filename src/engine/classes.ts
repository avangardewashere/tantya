/**
 * Mix classes and block thicknesses.
 *
 * Concrete classes run AA to C and mortar classes run A to D. **They share
 * their letters and mean completely different mixes.** Class A concrete is
 * about 9 bags of cement per cubic metre; class A mortar is a wall-surface
 * figure an order of magnitude smaller. Passing one where the other is wanted
 * would produce a believable, wrong number — the exact failure this project
 * is built to make impossible.
 *
 * So they are branded: `concreteClass('A')` and `mortarClass('A')` are
 * different types, and TypeScript refuses to swap them.
 */

declare const classBrand: unique symbol

/** Concrete mix class, from the plans. AA is richest. */
export type ConcreteClass = ('AA' | 'A' | 'B' | 'C') & {
  readonly [classBrand]: 'Concrete'
}

/** Mortar mix class, from the plans. A is richest. */
export type MortarClass = ('A' | 'B' | 'C' | 'D') & {
  readonly [classBrand]: 'Mortar'
}

export const CONCRETE_CLASSES = ['AA', 'A', 'B', 'C'] as const
export const MORTAR_CLASSES = ['A', 'B', 'C', 'D'] as const

export const concreteClass = (letter: (typeof CONCRETE_CLASSES)[number]): ConcreteClass =>
  letter as ConcreteClass

export const mortarClass = (letter: (typeof MORTAR_CLASSES)[number]): MortarClass =>
  letter as MortarClass

/** Every concrete class, as the branded type. For looping in tests and forms. */
export const allConcreteClasses = (): readonly ConcreteClass[] =>
  CONCRETE_CLASSES.map(concreteClass)

export const allMortarClasses = (): readonly MortarClass[] => MORTAR_CLASSES.map(mortarClass)

/**
 * CHB is sold by nominal inch size. 4, 5, 6 and 8 inch are 100, 125, 150 and
 * 200 mm thick. Which thicknesses Tantya offers is limited by which ones the
 * reference book gives factors for.
 */
export const CHB_THICKNESSES = [100, 125, 150, 200] as const
export type ChbThickness = (typeof CHB_THICKNESSES)[number]

/** What a builder calls it, for labels and the show-your-work line. */
export const CHB_NOMINAL_INCHES: Readonly<Record<ChbThickness, string>> = {
  100: '4"',
  125: '5"',
  150: '6"',
  200: '8"',
}

/** The shapes a concrete pour can take. All four are length × width × depth. */
export const CONCRETE_SHAPES = ['slab', 'footing', 'column', 'beam'] as const
export type ConcreteShape = (typeof CONCRETE_SHAPES)[number]
