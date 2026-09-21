'use client'

import { useId, useMemo, useState } from 'react'
import {
  CHB_NOMINAL_INCHES,
  CHB_THICKNESSES,
  CONCRETE_CLASSES,
  CONCRETE_SHAPES,
  MORTAR_CLASSES,
  concreteClass,
  mortarClass,
  type ChbThickness,
  type ConcreteShape,
} from '@/engine/classes'
import { toDecimalString } from '@/engine/fraction'
import { getMaterial } from '@/engine/materials'
import { parseMetres, type MeasurementError } from '@/engine/parse-metres'
import { PRODUCTION_FACTORS } from '@/engine/production-factors'
import { calculateNeeds, toPurchaseLines } from '@/engine/purchase-lines'
import type { FactorTable } from '@/engine/factors'
import { basisPoints } from '@/engine/units'
import type { CalculationError, PurchaseLine, WorkItem } from '@/engine/work-items'
import { formatQuantity } from './format'

/**
 * One form, one way in — which is what makes "walls and concrete" a single
 * feature rather than two.
 *
 * Two rules run through all of it:
 *
 *   **Text stays text until it is valid.** Nothing typed here becomes a
 *   number until `parseMetres` says it is one. A half-typed "2." is not 2,
 *   and an empty field is not 0. So there is no state in which a quantity
 *   can be computed from a value the person did not mean, and "NaN" has
 *   nowhere to come from.
 *
 *   **Show the working.** Every line prints the sum it came from. It is a
 *   trust feature, not decoration: it is how someone at a hardware counter
 *   decides whether to believe the number.
 */

type FieldState = { text: string; error: MeasurementError | null }

const field = (text = ''): FieldState => ({ text, error: null })

type OpeningDraft = { key: number; width: FieldState; height: FieldState; count: string }

type WallDraft = {
  length: FieldState
  height: FieldState
  thickness: ChbThickness
  mortar: (typeof MORTAR_CLASSES)[number]
  openings: OpeningDraft[]
}

type ConcreteDraft = {
  shape: ConcreteShape
  length: FieldState
  width: FieldState
  depth: FieldState
  count: string
  concrete: (typeof CONCRETE_CLASSES)[number]
}

const emptyWall = (): WallDraft => ({
  length: field(),
  height: field(),
  thickness: 150,
  mortar: 'A',
  openings: [],
})

const emptyConcrete = (): ConcreteDraft => ({
  shape: 'slab',
  length: field(),
  width: field(),
  depth: field(),
  count: '1',
  concrete: 'A',
})

/** Parse every measurement at once, so one pass gives values and errors. */
function readMeasurements(fields: readonly FieldState[]): {
  values: number[] | null
  errors: (MeasurementError | null)[]
} {
  const parsed = fields.map((f) => parseMetres(f.text))
  const errors = parsed.map((p) => (p.ok ? null : p.error))
  const values = parsed.every((p) => p.ok) ? parsed.map((p) => (p.ok ? p.value : 0)) : null
  return { values, errors }
}

export function WorkItemForm({
  factors = PRODUCTION_FACTORS,
}: {
  /** Taken as a prop so tests can hand in the frozen table. */
  factors?: FactorTable
}) {
  const [kind, setKind] = useState<'chbWall' | 'concrete'>('chbWall')
  // Kept apart so switching between the two never loses what was typed.
  const [wall, setWall] = useState<WallDraft>(emptyWall)
  const [pour, setPour] = useState<ConcreteDraft>(emptyConcrete)
  const nextOpeningKey = useState(() => ({ current: 0 }))[0]

  const ids = useId()
  const id = (name: string) => `${ids}-${name}`

  const built = useMemo(
    () => (kind === 'chbWall' ? buildWall(wall) : buildConcrete(pour)),
    [kind, wall, pour],
  )

  const outcome = useMemo(() => {
    if (!built.item) return null
    const needs = calculateNeeds(built.item, factors)
    if (!needs.ok) return { lines: null, error: needs.error }
    return { lines: toPurchaseLines(needs.value), error: null }
  }, [built.item, factors])

  return (
    <div className="flex flex-col gap-6">
      <fieldset>
        <legend className="mb-2 font-semibold">What are you measuring?</legend>
        <div className="flex gap-2">
          {(
            [
              ['chbWall', 'Hollow-block wall'],
              ['concrete', 'Concrete'],
            ] as const
          ).map(([value, label]) => (
            <label
              key={value}
              className={`min-h-(--touch-target) flex-1 cursor-pointer rounded border-2 px-3 py-2 text-center font-medium ${
                kind === value
                  ? 'border-accent-deep bg-accent text-ink'
                  : 'border-rule bg-paper-raised text-ink-soft'
              }`}
            >
              <input
                type="radio"
                name={id('kind')}
                value={value}
                checked={kind === value}
                onChange={() => setKind(value)}
                className="sr-only"
              />
              {label}
            </label>
          ))}
        </div>
      </fieldset>

      {kind === 'chbWall' ? (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <Measurement
              id={id('wall-length')}
              label="Length"
              value={wall.length.text}
              error={built.errors.length ?? null}
              onChange={(text) => setWall((w) => ({ ...w, length: field(text) }))}
            />
            <Measurement
              id={id('wall-height')}
              label="Height"
              value={wall.height.text}
              error={built.errors.height ?? null}
              onChange={(text) => setWall((w) => ({ ...w, height: field(text) }))}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Choice
              id={id('thickness')}
              label="Block thickness"
              value={String(wall.thickness)}
              onChange={(v) =>
                setWall((w) => ({ ...w, thickness: Number(v) as ChbThickness }))
              }
              options={CHB_THICKNESSES.map((t) => ({
                value: String(t),
                label: `${t} mm (${CHB_NOMINAL_INCHES[t]})`,
              }))}
            />
            <Choice
              id={id('mortar')}
              label="Mortar class"
              value={wall.mortar}
              onChange={(v) =>
                setWall((w) => ({ ...w, mortar: v as WallDraft['mortar'] }))
              }
              options={MORTAR_CLASSES.map((c) => ({ value: c, label: `Class ${c}` }))}
            />
          </div>

          <fieldset className="rounded border border-rule p-3">
            <legend className="px-1 text-sm font-semibold">Openings</legend>

            {wall.openings.length === 0 ? (
              <p className="text-sm text-ink-soft">
                No doors or windows yet. Their area comes off the wall before the
                blocks are counted.
              </p>
            ) : null}

            <ul className="flex flex-col gap-3">
              {wall.openings.map((opening, index) => (
                <li
                  key={opening.key}
                  className="grid grid-cols-2 gap-2 sm:grid-cols-[1fr_1fr_5rem_auto]"
                >
                  <Measurement
                    id={id(`ow-${opening.key}`)}
                    label="Width"
                    context={`of opening ${index + 1}`}
                    value={opening.width.text}
                    error={built.errors[`openingWidth${index}`] ?? null}
                    onChange={(text) =>
                      setWall((w) => ({
                        ...w,
                        openings: w.openings.map((o) =>
                          o.key === opening.key ? { ...o, width: field(text) } : o,
                        ),
                      }))
                    }
                  />
                  <Measurement
                    id={id(`oh-${opening.key}`)}
                    label="Height"
                    context={`of opening ${index + 1}`}
                    value={opening.height.text}
                    error={built.errors[`openingHeight${index}`] ?? null}
                    onChange={(text) =>
                      setWall((w) => ({
                        ...w,
                        openings: w.openings.map((o) =>
                          o.key === opening.key ? { ...o, height: field(text) } : o,
                        ),
                      }))
                    }
                  />
                  <Counter
                    id={id(`oc-${opening.key}`)}
                    label="How many"
                    context={`of opening ${index + 1}`}
                    value={opening.count}
                    onChange={(count) =>
                      setWall((w) => ({
                        ...w,
                        openings: w.openings.map((o) =>
                          o.key === opening.key ? { ...o, count } : o,
                        ),
                      }))
                    }
                  />
                  <button
                    type="button"
                    className="min-h-(--touch-target) self-end rounded border-2 border-rule px-3 font-medium"
                    onClick={() =>
                      setWall((w) => ({
                        ...w,
                        openings: w.openings.filter((o) => o.key !== opening.key),
                      }))
                    }
                  >
                    Remove<span className="sr-only"> opening {index + 1}</span>
                  </button>
                </li>
              ))}
            </ul>

            <button
              type="button"
              className="mt-3 min-h-(--touch-target) rounded border-2 border-ink px-4 font-semibold"
              onClick={() =>
                setWall((w) => ({
                  ...w,
                  openings: [
                    ...w.openings,
                    {
                      key: (nextOpeningKey.current += 1),
                      width: field(),
                      height: field(),
                      count: '1',
                    },
                  ],
                }))
              }
            >
              Add an opening
            </button>
          </fieldset>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <Choice
            id={id('shape')}
            label="What is it"
            value={pour.shape}
            onChange={(v) => setPour((p) => ({ ...p, shape: v as ConcreteShape }))}
            options={CONCRETE_SHAPES.map((s) => ({
              value: s,
              label: s[0].toUpperCase() + s.slice(1),
            }))}
          />
          <div className="grid grid-cols-3 gap-3">
            <Measurement
              id={id('c-length')}
              label="Length"
              value={pour.length.text}
              error={built.errors.length ?? null}
              onChange={(text) => setPour((p) => ({ ...p, length: field(text) }))}
            />
            <Measurement
              id={id('c-width')}
              label="Width"
              value={pour.width.text}
              error={built.errors.width ?? null}
              onChange={(text) => setPour((p) => ({ ...p, width: field(text) }))}
            />
            <Measurement
              id={id('c-depth')}
              label="Depth"
              value={pour.depth.text}
              error={built.errors.depth ?? null}
              onChange={(text) => setPour((p) => ({ ...p, depth: field(text) }))}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Counter
              id={id('c-count')}
              label="How many"
              value={pour.count}
              onChange={(count) => setPour((p) => ({ ...p, count }))}
            />
            <Choice
              id={id('c-class')}
              label="Concrete class"
              value={pour.concrete}
              onChange={(v) =>
                setPour((p) => ({ ...p, concrete: v as ConcreteDraft['concrete'] }))
              }
              options={CONCRETE_CLASSES.map((c) => ({ value: c, label: `Class ${c}` }))}
            />
          </div>
        </div>
      )}

      <Results lines={outcome?.lines ?? null} error={outcome?.error ?? null} />
    </div>
  )
}

/* ── Fields ─────────────────────────────────────────────────────────────── */

function Measurement({
  id,
  label,
  context,
  value,
  error,
  onChange,
}: {
  id: string
  label: string
  /**
   * Said only to a screen reader, to tell two fields apart when the screen
   * already does it by position: a wall has a Height, and so does every
   * opening in it.
   */
  context?: string
  value: string
  error: MeasurementError | null
  onChange: (text: string) => void
}) {
  const errorId = `${id}-error`
  // An empty field is not an error yet — it is a field nobody has reached.
  const show = error && value.trim() !== '' ? error : null

  return (
    <div className="flex min-w-0 flex-col gap-1">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
        {context ? <span className="sr-only"> {context}</span> : null}{' '}
        <span className="text-ink-soft">(m)</span>
      </label>
      <input
        id={id}
        // Text, not number: a number input silently drops what it cannot
        // parse, and Tantya has to say why it refused.
        type="text"
        inputMode="decimal"
        autoComplete="off"
        className="numeric min-h-(--touch-target) w-full rounded border-2 border-rule bg-paper-raised px-3 text-lg"
        value={value}
        aria-invalid={show ? true : undefined}
        aria-describedby={show ? errorId : undefined}
        onChange={(event) => onChange(event.target.value)}
      />
      {show ? (
        <p id={errorId} role="alert" className="text-sm font-medium text-danger">
          {show.message}
        </p>
      ) : null}
    </div>
  )
}

function Counter({
  id,
  label,
  context,
  value,
  onChange,
}: {
  id: string
  label: string
  context?: string
  value: string
  onChange: (value: string) => void
}) {
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
        {context ? <span className="sr-only"> {context}</span> : null}
      </label>
      <input
        id={id}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        className="numeric min-h-(--touch-target) w-full rounded border-2 border-rule bg-paper-raised px-3 text-lg"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  )
}

function Choice({
  id,
  label,
  value,
  onChange,
  options,
}: {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  options: readonly { value: string; label: string }[]
}) {
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      <select
        id={id}
        className="min-h-(--touch-target) w-full rounded border-2 border-rule bg-paper-raised px-2 text-lg"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  )
}

/* ── Results ────────────────────────────────────────────────────────────── */

function Results({
  lines,
  error,
}: {
  lines: readonly PurchaseLine[] | null
  error: CalculationError | null
}) {
  if (error) {
    return (
      <p role="alert" className="rounded border-2 border-danger p-3 font-medium text-danger">
        {error.message}
      </p>
    )
  }

  if (!lines) {
    return (
      <p className="text-ink-soft">
        Fill in every measurement to see what to buy.
      </p>
    )
  }

  return (
    <table className="w-full border-collapse text-left">
      <caption className="sr-only">What to buy</caption>
      <thead>
        <tr className="border-b-2 border-rule-strong">
          <th scope="col" className="py-2">
            Material
          </th>
          <th scope="col" className="py-2 text-right">
            Buy
          </th>
        </tr>
      </thead>
      <tbody>
        {lines.map((line) => {
          const material = getMaterial(line.material)
          return (
            <tr key={line.material} className="border-b border-rule align-top">
              <th scope="row" className="py-2 pr-2 font-medium">
                {material.name}
                {line.unverifiedFactor ? <UnverifiedChip /> : null}
                <span className="mt-1 block font-normal text-sm text-ink-soft">
                  {line.workings.join(' · ')}
                </span>
              </th>
              <td className="numeric py-2 text-right">
                <span className="block text-lg font-semibold">
                  {formatQuantity(line.quantityThousandths, material.unit)}
                </span>
                <span className="block text-sm text-ink-soft">
                  needs {toDecimalString(line.exactQuantity, 4).replace(/\.?0+$/, '')}
                </span>
              </td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}

function UnverifiedChip() {
  return (
    <span
      className="ml-2 rounded border border-accent-deep bg-accent px-1.5 py-0.5 text-xs font-semibold whitespace-nowrap text-ink"
      title="This factor has not been checked against a reference book yet."
    >
      unverified
    </span>
  )
}

/* ── Drafts to work items ───────────────────────────────────────────────── */

type Built = { item: WorkItem | null; errors: Record<string, MeasurementError | null> }

function buildWall(draft: WallDraft): Built {
  const { values, errors } = readMeasurements([draft.length, draft.height])
  const openingFields = draft.openings.flatMap((o) => [o.width, o.height])
  const openings = readMeasurements(openingFields)

  const named: Record<string, MeasurementError | null> = {
    length: errors[0],
    height: errors[1],
  }
  draft.openings.forEach((_, index) => {
    named[`openingWidth${index}`] = openings.errors[index * 2]
    named[`openingHeight${index}`] = openings.errors[index * 2 + 1]
  })

  const counts = draft.openings.map((o) => Number(o.count))
  const countsAreWhole = counts.every((c) => Number.isInteger(c) && c > 0)

  if (!values || !openings.values || !countsAreWhole) return { item: null, errors: named }

  return {
    item: {
      kind: 'chbWall',
      id: 'draft',
      label: 'Wall',
      wastage: basisPoints(0), // The field arrives in Block 2.
      length: values[0] as never,
      height: values[1] as never,
      thickness: draft.thickness,
      openings: draft.openings.map((_, index) => ({
        width: openings.values![index * 2] as never,
        height: openings.values![index * 2 + 1] as never,
        count: counts[index],
      })),
      mortarClass: mortarClass(draft.mortar),
    },
    errors: named,
  }
}

function buildConcrete(draft: ConcreteDraft): Built {
  const { values, errors } = readMeasurements([draft.length, draft.width, draft.depth])
  const named = { length: errors[0], width: errors[1], depth: errors[2] }

  const count = Number(draft.count)
  if (!values || !Number.isInteger(count) || count < 1) return { item: null, errors: named }

  return {
    item: {
      kind: 'concrete',
      id: 'draft',
      label: draft.shape,
      wastage: basisPoints(0),
      shape: draft.shape,
      length: values[0] as never,
      width: values[1] as never,
      depth: values[2] as never,
      count,
      concreteClass: concreteClass(draft.concrete),
    },
    errors: named,
  }
}
