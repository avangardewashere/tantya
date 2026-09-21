# Block 1: Materials calculator — the working plan

**Status:** 🔨 **phases 1–3 and 5 done** · 132 tests green in both timezones · all four planted bugs
caught · phase 4 still waiting on the reference book · phase 6 not started.

`PLAN.md` says *what* Block 1 is and lists rows B1-T1…T11. This file says *in what order*, and where
the work is blocked. It is the phasing, not a second spec — where the two disagree, `PLAN.md` wins.

**Feature:** "How many hollow blocks and bags of cement do I need?" Answered on one form, with the
working shown.

---

## What has to be true before Phase 1

| | Status |
|---|---|
| Block 0 merged, CI green | ✅ [PR #1](https://github.com/avangardewashere/tantya/pull/1) |
| **The reference book is named** | ❌ **open** — blocks Phase 4 only, not Phases 1–3 |
| Branch convention settled | ❌ **open** — Block 0 shipped on `claude/repo-review-v0-plan-k2n95x`; the plan says `block-1-materials-calculator` |
| Block 0's worked examples hand-checked | ❌ **open** — does not block Block 1, but the habit does |

**The book blocks less than it looks like it does.** The engine takes its factor table as an
argument, and the tests pass in a *frozen test table* that never changes. So the calculators, the
rounding and the form can all be built and proven before the book is open. Only the **production**
table and `test:release` need it. That is Phase 4, and it can slide.

---

## The phases

Six phases, about four sessions. A session is one sitting of roughly two hours.

| Phase | What | Rows closed | Session |
|---|---|---|---|
| 1 | Worked examples, both columns · the types · the frozen test table | — | ✅ done |
| 2 | `chbWall` and `concrete` | B1-T1, T2, T3, T4, T7 | ✅ done |
| 3 | `toPurchaseLines` | B1-T5 | ✅ done |
| 4 | Production factor table · `test:release` ← **needs the book** | B1-T6, T8 | ⏸ blocked |
| 5 | `WorkItemForm` | B1-T9, T10 | ✅ done |
| 6 | Coverage, planted bugs, hand checks, block note, gate | B1-T11 | ⏳ |

---

### Phase 1 · Work the examples, then declare the shapes

**No calculator is written in this phase.** This is the step the block loop puts before the code, and
the one that makes the rest worth anything.

1. **You and I work each example separately** — you on paper or a calculator, me on my own — and both
   workings go into `docs/worked-examples.md`. They must match before the row becomes a test.
   The examples to work: B1-T1 (the float trap), B1-T2 (three wall cases), B1-T4 (footings, four
   classes), B1-T5 (two columns), B1-T7 (the largest allowed inputs).
2. **Fix the frozen test table.** Deliberately not real numbers — round ones that make the arithmetic
   checkable by hand, and one factor left **unverified on purpose** so correcting a real factor later
   never turns the suite red. From `PLAN.md`: 12.5 blocks per m², 9 bags per m³ for class A, 7.5 for
   class B. Mortar cement and sand per m² by thickness × mortar class get their frozen values here.
3. **Declare the types**, with no behaviour behind them yet: the `WorkItem` union (`chbWall` ·
   `concrete` · `custom`), `MaterialNeed`, `PurchaseLine`, `Material`, and the `FactorTable`
   interface the engine takes as an argument.

**Ends when:** the types compile, and every example has two matching columns.

**The trap this phase avoids:** writing the calculator first, then reading its output into the test.
A shared mistake then passes green, and 28 bags looks exactly as believable as 27.

---

### Phase 2 · The engine

Two pure functions in `src/engine`, returning **exact needs only** — never a rounded number.

- **`chbWall(input, factors)`** — blocks from the net face area with openings taken out, plus cement
  and sand for mortar, by block thickness (100 · 125 · 150 · 200 mm) and mortar class.
- **`concrete(input, factors)`** — 40 kg bags, sand and gravel by concrete class, for a slab,
  footing, column or beam. All four are length × width × depth × count, so they are one calculation
  with four labels, not four calculations.

Concrete classes (AA–C) and mortar classes (A–D) share their letters and mean different mixes, so
they become **different types**. The `switch` over the work kinds gets an exhaustive check — a line
that makes TypeScript complain when Block 5 adds `rebar` and a `switch` forgets it.

**Wastage lives here, not on the form.** The rule is `PLAN.md`'s first rounding rule: wastage is
applied **before** rounding up, never after. B1-T2 pins it — 3.0 × 2.7 m at 5% is 106.3125, so 107,
where the wrong order gives 108. The *field* arrives in Block 2; the engine accepts the value now and
the form passes zero.

**Rows:** B1-T1, T2, T3, T4, T7.
**Ends when:** the engine is green against the frozen test table, in Jest's node environment.

---

### Phase 3 · `toPurchaseLines`

`toPurchaseLines(needs, materials)` adds up the needs per material, **then** rounds up once per
material. This is the only place in Tantya a quantity is ever rounded.

**Rows:** B1-T5 — two class B columns, 3.15 m and 3.25 m tall, need exactly **3 bags**. Rounded
separately they come to 4. Block 0 already proved the shape of this at the ruler; here it is proved on
real work items.

**Ends when:** rounding happens in exactly one place, and a test would notice if it didn't.

---

### Phase 4 · The production factor table ← **blocked on the book**

Everything above runs on invented numbers. This is where real ones arrive.

- Each factor carries a **source** (book, edition, page or table — not "the internet") and a
  `verifiedOn` date that **starts empty**.
- `docs/factors.md` lists the same keys and the same dates, so the table and the document cannot
  drift apart.
- **`npm run test:release`** is born here: it fails while any production factor has an empty
  `verifiedOn`. It is deliberately **not** part of `npm test`, so an unverified factor never blocks a
  day's work — it blocks a release.

**Rows:** B1-T6 (every thickness × class pair exists, is positive, has a source, and is a whole number
of millionths with nothing lost), B1-T8 (`test:release` red with one `verifiedOn` blanked, green when
all are filled).

**Your part, which I cannot do:** check every factor against the book — about 35 to 40 numbers, one
sitting — and fill in `verifiedOn`. It can finish any time before the v1 release. Until it does, every
unverified factor shows an **"unverified" chip** in the app so nobody mistakes it for a checked number.

---

### Phase 5 · `WorkItemForm`

One form, one way in — which is what makes wall-plus-concrete a single feature rather than two.

- Pick wall or concrete, type metres.
- Each material shows three things: the **exact quantity**, the **quantity to buy**, and a
  **show-your-work line** — `6.21 m² × 12.5 pcs/m² = 77.625, buy 78`. The working line is a trust
  feature, not decoration: it is how a foreman decides whether to believe the number.
- Any unverified factor carries the **"unverified" chip**.
- Number inputs stay as text until they are valid, so Block 0's `parseMetres` refusals render as
  inline `role="alert"` errors rather than silently becoming numbers.
- `inputMode="decimal"`, labels on every input, and **"NaN" and "Infinity" never render**.
- The form takes the factor table as a **prop that defaults to the production table**, so tests pass
  the frozen one in.

**No prices in this phase.** They are Block 2.

**Rows:** B1-T9, B1-T10.

---

### Phase 6 · Close the testing phase

1. **B1-T11 — coverage**: at least 95% of branches in `src/engine`, enforced in CI as a named check.
   Coverage only shows a line ran, not that its answer was checked; the planted bugs are the real
   proof.
2. **Plant four bugs**, one at a time, each restored after: multiply in floats · round up before
   wastage · forget to subtract openings · round each need before adding. Each must turn at least one
   named test red. Block 0's lesson applies — check that the *obvious* rows aren't the only ones
   holding, because a suite of round numbers can sleep through a real bug.
3. **Hand checks:** the numeric keypad appears on Android; one hand can reach every control.
4. **Block note** `docs/blocks/block-1.md`, summary, gate.

---

## Cut line

**None that keeps the feature whole.** If Block 1 runs long, the testing phase is taken in two
sittings — engine rows, then form rows — but the block does not close early.

The one real lever is the scope decision already made on 2026-09-21: two tied parts behind one way in
is one feature, so Block 1 ships wall **and** concrete. On the strict reading it would ship walls
only, with concrete going to the Backlog. That was decided, and reopening it is a re-plan, not a cut.

## Not in this block

Prices · more than one item on a sheet · a wastage *field* (the engine rule is here, the field is
Block 2) · plaster · steel · saving.

## Gate at the end

> Block 1 is done. *(summary, 1–3 sentences)* Tests: N passing, 4 planted bugs caught, CI green.
> Outside Jest: 2 ✅.
> **Shall I start Block 2, the estimate sheet with prices?**


---

## Checkpoint after phase 3

**109 tests, 8 suites, green under `npm test` and `npm run test:utc`.** Lint, typecheck and build
clean. Engine branch coverage **86.9%** — below B1-T11's 95% bar, which is phase 6's job; the gaps
are Block 0 guard clauses in `fraction.ts` and `units.ts`, not the new calculators (`chb-wall.ts`,
`concrete.ts` and `purchase-lines.ts` are all at 100%).

All four of Block 1's bugs were planted early, one at a time, and restored:

| Planted bug | Tests turned red |
|---|---|
| Multiply in floats | 6 |
| Round up before wastage | 6 |
| Forget to subtract the openings | 3 |
| Round each need before adding | 3 |

**What planting them early found.** The first pass of the float bug did **not** turn B1-T1 red — the
row whose entire job is the float trap. Floating-point multiplication is order-dependent:
`0.1 * 3 * 10` is `3.0000000000000004`, but `3 * 10 * 0.1` is exactly `3`. The planted engine
multiplied length × width × depth and so passed the golden by luck.

A second, order-independent golden was worked out and added: a 10 m × 10 m slab 70 mm thick is
exactly **63 bags**, and every float ordering gives `63.00000000000001` → 64. Re-planting the bug
now turns B1-T1 red.

This is the argument for planting bugs at all, made concrete. Coverage would have shown that line
green either way.


---

## Checkpoint after phase 5

Phase 5 was taken before phase 4 because phase 4 is blocked on the book and phase 5 is not, and
because the app had a proven engine with no way in.

**132 tests, 9 suites, green in both timezones.** Lint, typecheck, build clean. B1-T9 and B1-T10
closed.

### Two things the browser caught that jsdom could not

1. **The page scrolled sideways at phone width** — 748 px of content in a 393 px viewport. A text
   input has an intrinsic minimum width and a `1fr` grid column honours it, so the openings row
   refused to shrink. Fixed with `min-w-0` on each cell, `w-full` on each control, and two columns
   instead of four until there is room. Re-measured: `scrollWidth` 393 = `clientWidth`.

   jsdom has no layout engine, so **no Jest test could ever have found this.** It is exactly what
   the plan's "outside Jest" list is for, and it was found by driving a real browser at 393 × 851.

2. **Two fields both called "Height"** — the wall's, and each opening's. Identical accessible names,
   which is fine on screen (the layout says which is which) and useless to anyone listening to the
   page. jest-axe passed it, because ambiguous-but-present labels are not a violation. Fixed with an
   `sr-only` qualifier: "Height of opening 1". The Remove buttons got the same treatment.

### An interim deviation

`src/engine/production-factors.ts` exists now, one phase early, because the form's contract is that
its `factors` prop **defaults to the production table**. Every factor in it has `verifiedOn: null`
and a source that says `PLACEHOLDER`, which is the truth. The consequences are visible and
deliberate:

- every line in the running app carries the **unverified** chip;
- the page shows a red banner, driven by `everyFactorIsUnverified()` rather than hard-coded, so it
  cannot be left up after the table is real or taken down before;
- phase 4's `test:release` will refuse to pass until the dates are filled in.

Phase 4 replaces the values, the sources and the dates. Nothing about the structure changes.

### Still open

- **Phase 4** — the reference book.
- **Phase 6** — engine branch coverage was 86.9% before the form; B1-T11 wants 95%, enforced in CI.
- **The Android hand checks** — the numeric keypad and one-handed reach, both waiting on Vercel.
  The desktop half of the layout check is done and recorded above.
