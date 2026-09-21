# Tantya: build guide

> **Tantya** (from Tagalog *tantiya*) means *an estimate*: the sum a foreman does in their head before
> ordering materials. Tagline: **Sukat in, quotation out.**
> A phone-first materials and cost estimator for small Philippine construction jobs. You type real
> measurements. It tells you what to actually buy (whole hollow blocks, 40 kg cement bags, cubic metres
> of sand), prices it in pesos, and lays it out as a quotation you can print or paste into Messenger.

## Goal

Take a fourth app from an empty folder to shipped, **three features at a time**. This one is new in one
big way: in Habibit, Sipat and Tipon a bug looked like a bug. Here **a wrong answer looks exactly like a
right one**. 28 bags of cement looks as believable as 27. So the skill this project teaches is numeric
correctness: whole-number maths, rounding as a decision you write down, and tests built from examples
worked out by hand.

## Who it's for

| | |
|---|---|
| **Main user** | A small contractor, foreman or freelance site engineer doing fences, room extensions and small houses. Today they quote from memory, a notebook or a personal Excel sheet, standing in a hardware store with an Android phone |
| **Second user** | A homeowner or OFW family checking whether a contractor's materials list is reasonable |
| **Not for** | Quantity surveyors on large projects, government (DPWH) bid formats, or anyone expecting structural design. Tantya counts materials for a design someone else is responsible for |

## How we work: the rules of this guide

1. **Three features per version.** No more, no fewer.
2. **One feature per block.** A *feature* is one new thing a user can do, with one way in. So every
   version is exactly three blocks.
3. **Every block has its own testing phase**, and it must pass before the block can close.
4. **Every block ends with a summary of one to three sentences.**
5. **Claude asks before starting the next block.** No yes, no next block. The same goes for starting a
   version, using a cut line, changing an earlier test, and adding a new tool.

### The block loop

```
 plan the block ─► WORK THE EXAMPLES BY HAND ─► write the test rows ─► build ─► TESTING PHASE
 (read this file)  (you and Claude, separately;                                  │ red? fix, run again
                    the answers must match)                                      ▼
        ASK ◄── SUMMARY ◄── block note ◄── WALKTHROUGH ◄── YOUR ANDROID CHECKS ◄─┘
 "Start Block N+1?"  (1–3        (docs/blocks/)  (Claude walks you through
  wait for a yes     sentences)                   the new files; you ask)
```

**Working the examples by hand is the core skill, so it is a step.** You work each example on paper or a
calculator. Claude works it separately. The two answers must match before the row becomes a test. Both
workings go in `docs/worked-examples.md`. If the same author writes the expected number and the code, a
shared mistake passes green. **The example numbers printed in this file are Claude's only, so they
count as "to be confirmed by hand".**

### What "testing phase" means

A block's testing phase is done only when all seven are true:

1. **Every row in this file exists as a test, or as a named check** (a CI job, a coverage setting, a
   lint rule). Every row has an ID (`B1-T3`) so a failure can be named. The block note links each row
   to the file that proves it.
2. **`npm test` is green**, pinned to Manila time, on this PC and in CI.
3. **`npm run test:utc` is green:** the same suite under UTC. GitHub's machines run on UTC, 8 hours
   behind Manila, so between midnight and 8 a.m. Manila time "today" is a different date there. Date
   code that is right in only one zone is wrong. There is no date code until Block 3, so until then
   this run is boring. It is wired in Block 0 so it is never forgotten.
4. **Planted bugs go red.** Realistic bugs are planted one at a time. Each must fail at least one test,
   then the file is restored. A test only counts if it goes red when the fix is removed.
5. **Every earlier block's tests still pass, unchanged.** If an earlier test truly has to change, that
   is a deviation: Claude stops, names the row and the reason, and waits for a yes.
6. **CI is green on GitHub:** lint, typecheck, `test`, `test:utc`, build.
7. **The "outside Jest" list is run by hand.** Claude runs the desktop Chrome items and gives you the
   Android items as a short checklist. A failed item on desktop or Android Chrome keeps the block open.
   A not-checked item (⏭️) closes the block only if you say so at the gate. iOS is never required.

### Cut lines

Every block names what gets dropped if it runs long. **Claude asks before using a cut line.** Cut work
goes to the [Backlog](#backlog), never into another block, and comes back only when a version is
re-planned. Each cut line names the test rows it drops, and the block note marks them ⏭️ with the reason.

### The test tools (my recommendation)

You said "React Jest or what do you want". My pick is what Sipat already uses (Tipon has all but
jest-axe):

| Tool | Used for |
|---|---|
| **Jest 30** through `next/jest` | Everything. Pure functions get table tests with `test.each` |
| **React Testing Library + user-event** | Screens: type into fields, press buttons, find things by role and label |
| **jest-axe** | A basic accessibility check on each screen. It cannot check colour contrast |
| **Seeded random loops** (a 5-line number generator, no library) | Rules that must hold for *every* input, such as "the total always equals the sum of the lines". *Seeded* means the random numbers start from a fixed number, so a failure can be replayed exactly |
| **Playwright** | Block 9 only, and only after asking you. The Next.js 16 docs say Jest cannot render `async` Server Components and recommend an end-to-end test for them |

Screen tests run in **jsdom**, the pretend browser Jest uses. It has a page structure but no layout, no
print engine and no clipboard. Tests of pure code (the engine, money, tokens, CSV bytes) run under
Jest's plain **node** environment, which is faster and has tools jsdom lacks (`TextEncoder`,
`structuredClone`, `crypto.subtle`).

Most of this product is pure functions, which is the best case for Jest. But be exact about what green
means: **a green run proves the code matches the examples. It proves the feature is right only because
the examples were worked out separately from the code.**

### What the ask sounds like

> Block 2 is done. *(summary, 1–3 sentences)* Tests: 148 passing, 3 planted bugs caught, CI green.
> Outside Jest: 2 ✅ (the table at phone width, on desktop and on your Android).
> **Shall I start Block 3, the quotation?**

## Before you say yes

**Size.** A session is one sitting of about two hours. These are rough guesses: Block 0 is about 3
sessions and Blocks 1 to 3 about 4 each, so **v1 is roughly 15 sessions** plus the release. v2 and v3
are sized when they are re-planned.

**Your part, which Claude cannot do for you:**
- Have a reference book in hand before Block 1 (see [Decisions](#decisions)).
- Work each example by hand before its test is written.
- Check every factor against the book once: about 35 to 40 numbers, one sitting.
- Run the Android checks.
- Create accounts and paste keys yourself (GitHub, Vercel, Supabase). Claude walks you through it and
  never sees a key.
- Find one person who builds to look over the factors before the v1 release, and to try v1 after it.

**What a yes to Block 0 accepts:** every row in [Decisions](#decisions) marked "Block 0". The name
matters most, because it becomes the repo and the URL. Everything marked for a later block is asked
again at that block's gate.

## Stack

| Piece | Choice | Why |
|---|---|---|
| Framework | Next.js 16 (App Router) + React 19 | Same as Habibit, Sipat and Tipon |
| Language | TypeScript, strict | Mistakes show up before the code runs. Concrete classes and mortar classes share letters, so they become different types |
| Styling | Tailwind CSS 4 | Same as before |
| Tests | Jest 30, React Testing Library, user-event, jest-axe | See above |
| Validation | Zod (from Block 4) | Checks data we didn't just create: saved files, rows from a database |
| Backend | Supabase (from Block 8) | You already know it from Habibit v2 |
| CI | GitHub Actions | Every push runs lint, typecheck, both test runs and the build |
| Hosting | Vercel free tier | Connected in Block 0. Every block's branch gets a preview link to open on your phone |

## The numbers rule: whole numbers all the way

Floats are the trap this project exists to teach. In JavaScript `0.1 * 3 * 10` is
`3.0000000000000004`. So a 3 m × 10 m slab 100 mm thick, at 9 bags of cement per m³, can round up to
28 bags instead of 27.

| Thing | Stored as |
|---|---|
| Lengths | whole **millimetres** (`'2.70'` becomes `2700`) |
| Factors | whole **millionths** (12.5 blocks per m² is `12_500_000`), so a four-decimal factor from a book, such as 0.0435, fits with nothing lost |
| Percentages | **basis points**, hundredths of a percent (5% is `500`) |
| Quantities inside the engine | **exact fractions:** a `BigInt` numerator over a fixed denominator. Nothing is rounded until the purchase line |
| Quantities to buy | whole thousandths of a unit, rounded **up** to the store's step (1 bag, 1 piece, 0.5 m³) |
| Money | whole **centavos** |

**Why `BigInt`.** mm × mm × mm gets huge. That slab is 3,000,000,000 mm³. Times a factor in millionths
and a wastage in basis points, it is far past the largest whole number a plain JavaScript number holds
exactly (about 9 × 10¹⁵). `BigInt` has no such limit. It stays inside the engine; what comes out is an
ordinary number. Where a need divides by a typed value (paint coverage, steel weight), one documented
round-up to the millilitre or gram is allowed.

Four rounding rules, each pinned by a test:

1. **Wastage is applied before rounding up**, never after (a 3.0 × 2.7 m wall at 5%: 107 blocks, not 108).
2. **Round up once, at the purchase line.** Needs of 5.2 bags and 8.6 bags are 14 bags, not 6 + 9 = 15.
3. **Each line amount is rounded half-up to the centavo. The total is the sum of the lines**, never
   rounded again.
4. **Net + VAT always equals the total.** When VAT is already included, net is worked out once and VAT
   is the total minus net. Two separate roundings could drift by a centavo.

## The data

```
Material      id · name · unit (bag | pc | m3 | kg | can | lot) · purchase step · sample price
Factor        key · value · unit · net or includes-allowance · source · verifiedOn (empty = unverified)
WorkItem      id · label · wastage · one of:
                chbWall   length, height, thickness (100 | 125 | 150 | 200 mm, as far as your
                          reference gives factors), openings[], mortar class
                concrete  shape label, length, width, depth, count, concrete class
                custom    description, quantity, unit, unit price
                (v2 adds the kinds rebar and paint; plaster is new fields on chbWall)
MaterialNeed  material · exact quantity (a fraction) · "because" text (the show-your-work line)
PurchaseLine  material · quantity rounded up to its step · unit price · amount · which items feed it
Estimate      id · title · items[] · your prices · quote settings · quote header · timestamps
```

Totals are never stored. They are always worked out from the lines.

**Prices:** the estimate's own price if you set one, otherwise the sample price. From Block 4 an
estimate saves the prices it used, so an old estimate never changes when the sample prices do.

**Where state lives:** v1 in memory, v2 in localStorage on the device, v3 in Supabase as well. The only
thing that lives in a URL is the client quote token in Block 9.

## Roadmap: three versions, nine features

| Version | Theme | Feature 1 | Feature 2 | Feature 3 |
|---|---|---|---|---|
| **v1** | One job, from sukat to quote. In memory, no accounts | **1** Materials calculator | **2** Estimate sheet with peso prices | **3** Quotation: print and copy as text |
| **v2** | A tool you come back to. Saved on the device | **4** Saved estimates | **5** Steel: cutting list | **6** Wall finishes: plaster and paint |
| **v3** | Out of one phone. First server code | **7** Export: CSV and the share sheet | **8** Accounts and cloud backup | **9** Client quote link |

**Progress:** this guide was pushed to GitHub on 2026-09-21. Nothing is built yet. All six Block 0
decisions were agreed on 2026-09-21 (see [Decisions](#decisions)). Waiting for your yes on Block 0 itself.

v1 is planned in full. v2 and v3 are the current best guess and get **re-planned when that version
starts**, with what we learned and what a real user said.

---

## Block 0: Groundwork (not a feature)

Setup is not a feature (no user can do anything with it), so it sits outside the three. It still
follows the loop: tests, summary, ask.

**What we build**
- `create-next-app` in `Shipped Products/tantya`: Next.js 16, React 19, strict TypeScript, Tailwind 4, `src/` folder.
- Jest through `next/jest`, React Testing Library, user-event, jest-dom, jest-axe. Pure test files
  start with a `@jest-environment node` line.
- **Timezone:** `jest.config.ts` pins every run to `Asia/Manila` unless `TANTYA_TEST_TZ` is set, the
  Sipat way. `npm run test:utc` uses Sipat's `scripts/test-in-timezone.mjs` to set it to `UTC`.
  (Setting `process.env.TZ` inside a test does nothing.)
- **The folder contract:** `src/engine` (pure maths), `src/money`, `src/quote`, `src/store`, `src/ui`,
  `src/app`. An ESLint rule stops `src/engine` importing React or Next. *Why:* so the maths can be
  tested without a browser, and reused on the server in Block 9 without dragging a screen along.
- **The ruler** in `src/engine`: `parseMetres`, `roundUpToStep`, the exact-fraction type and the unit
  types. It is what every later calculation measures with, so it is trusted before Block 1 starts.
- **The look:** colours and type as CSS variables, and the page shell (header, empty main area).
- `.gitattributes`. *Why:* Git on Windows can rewrite line endings on checkout. Block 7 keeps expected
  CSV text with Windows line endings on purpose; without this file a test could pass here and fail on CI.
- A GitHub repo, the Actions workflow, and **Vercel connected now** through the dashboard. *(You do
  this; there is no Vercel CLI on this PC.)* Tipon left this late.
- `docs/factors.md` and `docs/worked-examples.md` as empty templates, a draft disclaimer, and a
  `tantya` entry in `.claude/launch.json` on port 3004.

**What you learn.** *The one new idea:* whole numbers as the ruler, behind a lint rule that walls the
maths off from React. *Also:* the rest is your fourth run of a setup, on purpose; why two timezones.

**Testing phase**

| ID | Proves |
|---|---|
| B0-T1 | Smoke test: the shell renders a heading "Tantya", and jest-axe finds nothing |
| B0-T2 | Timezone: a test asserts the offset is −480 minutes under `test` and 0 under `test:utc` |
| B0-T3 | The lint wall: a Jest test runs ESLint on a small file that imports React from inside `src/engine` and expects one error |
| B0-T4 | `parseMetres`: `'2.7'` is 2700, `' 3 '` is 3000, `'1.005'` is 1005 (the float version gives 1004). `'2,7'`, `'3m'`, `'10ft'`, `'1e3'`, `''`, `'abc'`, `'-1'`, `'0'` and `'2.7005'` (more than 3 decimals) each give a named error, never a rounded value |
| B0-T5 | `roundUpToStep` works on whole numbers only: 2.26 of a unit at a 0.5 step is 2.5; exact multiples stay put; 0 stays 0; a negative or a step of 0 throws. A recorded counter-example: `Math.ceil(0.7 / 0.1) * 0.1` is `0.7000000000000001` |
| B0-T6 | The float trap, at the ruler: `0.1 * 3 * 10` is not 3, while 100 × 3000 × 10000 mm is exactly 3,000,000,000 mm³ |
| B0-T7 | CI is green: lint, typecheck, test, test:utc, build (a named check) |

**Planted bugs:** `parseFloat` then multiply in `parseMetres`; `Math.round` in place of rounding up.

**Outside Jest:** the preview link opens on your Android phone; text contrast is checked once in Chrome
DevTools and once outdoors on the phone; `npm run build` passes.

**Cut line:** none. Everything here is foundation.

> **Summary:** Block 0 builds the workshop, not the product: a Next.js app with Jest, CI and a preview
> link, the chosen look, and a whole-number "ruler" the maths will measure with. After it, every later
> block starts from a green, deployed app.
>
> **Gate:** stop and ask, "Groundwork is done. Before Block 1 I need your yes on the reference book for
> factors. Then: shall I start Block 1, the materials calculator?"

---

# Version 1: One job, from sukat to quote

Type the measurements for one job, get a correct materials list, price it, and send a quotation. Nothing
is saved yet. The PDF or the pasted text is the record, the same trade-off as Habibit v0.

## Block 1: Materials calculator

**Feature:** "How many hollow blocks and bags of cement do I need?" Answered on one form, with the
working shown.

**What we build**
- In `src/engine`, two calculators that return **exact needs only**, never rounded:
  - `chbWall(input, factors)`: blocks from the net face area (openings taken out), plus cement and sand
    for mortar by block thickness and mortar class. (CHB is a concrete hollow block.)
  - `concrete(input, factors)`: 40 kg cement bags, sand and gravel by concrete class for a slab,
    footing, column or beam. All four are length × width × depth × count.
- `toPurchaseLines(needs, materials)`: adds up the needs per material, then rounds up **once** per
  material. This is the only place a quantity is rounded.
- **Factor tables as typed data.** Each factor has a source, and a `verifiedOn` date that starts empty.
  The engine takes the table as an argument. The form gets it through a prop that defaults to the
  production table. Tests pass in a **frozen test table**, which keeps one factor unverified on
  purpose. So correcting a real factor later never turns the suite red.
- `npm run test:release`: fails while any production factor has an empty `verifiedOn`. It is not part
  of `npm test`.
- A `WorkItemForm` component: pick wall or concrete, type metres. Each material shows the exact
  quantity, the quantity to buy, and a **show-your-work line** ("6.21 m² × 12.5 pcs/m² = 77.625, buy
  78"). Any factor not yet verified carries an **"unverified" chip**. No prices yet.

**What you learn.** *The one new idea:* do the sums in whole numbers and write every rounding down as a
decision, pinned by examples worked by hand. *Also:* typed data tables (`as const satisfies`); a union
of work kinds with an exhaustive check (a line that makes TypeScript complain when a new kind is added
and a `switch` forgets it); number inputs kept as text until they are valid; showing the working as a
trust feature.

**Testing phase** (engine rows use the frozen test table: 12.5 blocks per m², 9 bags per m³ for class A)

| ID | Proves |
|---|---|
| B1-T1 | **The float trap, in the engine.** A test records that `Math.ceil(0.1 * 3 * 10 * 9)` is 28. The engine, given `'0.1'`, `'3'`, `'10'` and class A, gives exactly **27 bags** |
| B1-T2 | Wall goldens: 3.0 × 2.7 m is exactly 101.25, so **102 pcs**. With one 0.9 × 2.1 m door and no wastage it is 77.625, so **78 pcs**. The wall with no door and 5% wastage applied before rounding is 106.3125, so **107** (the wrong order gives 108) |
| B1-T3 | Thickness changes the mortar but never the block count. Openings bigger than the wall give a named error, never a negative number |
| B1-T4 | Concrete goldens: six 1.0 × 1.0 × 0.25 m footings are 1.5 m³, so 13.5 and **14 bags** at class A, and sand 0.75 rounds up to **1.0 m³** at a 0.5 step. One row per class AA, A, B and C |
| B1-T5 | `toPurchaseLines` adds before it rounds: two class B columns (7.5 bags per m³), 0.25 × 0.25 m and 3.15 m and 3.25 m tall, need exactly **3 bags**, not 4 |
| B1-T6 | Production factor table: every thickness × class pair exists, is positive and has a source; every value is a whole number of millionths with nothing lost; `docs/factors.md` lists the same keys and dates |
| B1-T7 | The largest allowed inputs match a value worked out by hand |
| B1-T8 | `test:release` is red with one `verifiedOn` blanked (planted) and green when all are filled |
| B1-T9 | Form (frozen table passed in): type 3 and 2.7, pick 6 inch (150 mm), see "102 pcs". Add the door, see "78 pcs". The working line and the "unverified" chip are visible |
| B1-T10 | Form: clear a field and an inline `role="alert"` error appears; "NaN" and "Infinity" never render; inputs have labels and `inputMode="decimal"`; jest-axe finds nothing |
| B1-T11 | Coverage: at least 95% of branches in `src/engine`, enforced in CI (a named check). Coverage only shows a line ran, not that its answer was checked. The planted bugs are the real proof |

**Planted bugs:** multiply in floats; round up before wastage; forget to subtract openings; round each
need before adding.

**Outside Jest:** the numeric keypad appears on Android; one hand can reach every control.
**Your part:** the factor check against your book, filling in `docs/factors.md`. It can finish any time
before the v1 release, where `test:release` enforces it.

**Cut line:** none that keeps the feature whole. If it runs long, the testing phase is taken in two
sittings (engine rows, then form rows), but the block does not close early.

**Not in this block:** prices, more than one item, a wastage field (the engine rule is here; the field
arrives in Block 2), plaster, steel, saving.

> **Summary:** Block 1 is the heart of Tantya: a pure, whole-number engine that turns the measurements
> of a hollow-block wall or a concrete pour into what to buy, and one form that shows its working.
> It is already useful on its own at the hardware store.
>
> **Gate:** stop and ask, "Shall I start Block 2, the estimate sheet with prices?"

## Block 2: Estimate sheet with peso prices

**Feature:** put several pieces of work on one sheet and see one consolidated shopping list with a peso
total.

**What we build**
- An estimate reducer: add, edit, duplicate and remove work items. IDs and the clock are passed in, as
  in Tipon.
- Block 1's `WorkItemForm` becomes the add/edit item form: reused, not rewritten. It gains the wastage
  field.
- **Custom line items** ("Panel door, 2 pcs, ₱4,500"). This is the pressure valve: any trade without a
  calculator still fits in a quote.
- `consolidate(items)`: runs every item's calculator and hands all the needs to the same
  `toPurchaseLines`, so rounding still happens once.
- A money module: whole centavos, `parsePeso`, a hand-written `formatPeso` (no `Intl`, so Node and your
  phone print the same text), and `lineAmount` with half-up rounding.
- **Sample prices**, labelled "sample prices, edit to match your hardware store" and dated. Any price
  can be changed for this estimate. `test:release` also fails if a sample price loses its label.
- Screen: the item list, the consolidated materials table, and the total. Tap a line to see which items
  feed it.

**What you learn.** The reducer is Tipon's pattern again, on purpose. *The one new idea:* money in whole
centavos, rounded once, with totals always worked out and never stored. *Also:* seeded random loops; a
custom line as the thing that keeps scope under control.

**Testing phase**

| ID | Proves |
|---|---|
| B2-T1 | `consolidate`: needs of 5.2 and 8.6 bags give **14**, not 15. The same material from different items merges. Custom items never merge. An empty estimate gives no lines and a total of 0 |
| B2-T2 | `parsePeso`: `'1,250.50'` is 125050, `'₱260'` and `'PHP 260'` are 26000, `'260.5'` is 26050. `'260.505'`, `'1.2.3'`, `'-5'`, `''` and `'1,25'` give named errors |
| B2-T3 | `formatPeso`: 0 is `₱0.00`, 5 is `₱0.05`, 125050 is `₱1,250.50`, 100000000 is `₱1,000,000.00` |
| B2-T4 | `lineAmount`: 1.150 units at ₱0.50 is **₱0.58**. A test records that the float version, `Math.round(1.15 * 0.5 * 100)`, is 57 |
| B2-T5 | `lineAmount` refuses, with a named error, when quantity × price would pass `Number.MAX_SAFE_INTEGER`. The test asserts both sides of that boundary. Half-up uses quotient and remainder |
| B2-T6 | Seeded loop, 500 random sets of lines: the total always equals the sum of the line amounts |
| B2-T7 | Reducer: every action; an unknown action returns the same object; frozen state is never changed in place |
| B2-T8 | Screen (frozen table passed in, with 1.018 bags of mortar cement per m²): the 3.0 × 2.7 m wall with its door (6.32 bags) plus a 3.0 × 2.8 × 0.1 m slab (7.56 bags) shows **one** "Cement 40 kg" row with **14 bags**, not 7 + 8 = 15. Change its price from 260 to 275 and the amount and total update. The change survives adding another item |
| B2-T9 | Screen: add and remove a custom item; the total has an accessible name; jest-axe finds nothing |
| B2-T10 | `test:release` is red if a sample price loses its "sample" label |
| B2-T11 | Coverage: at least 95% of branches in `src/money` (a named check) |

**Planted bugs:** round up per item instead of once; `lineAmount` in floats; a stored total instead of a
worked-out one.

**Outside Jest:** the table reads well at phone width with no sideways scroll, on desktop and on your
Android. On Android, leave the tab in the background for a few minutes and note whether the estimate
survives. It may not; that is the known v1 limit Block 4 fixes.

**Cut line:** the "which items feed this line" view and "duplicate" go to the Backlog. Drops the
duplicate case in B2-T7.

**Not in this block:** labour, markup, VAT, the quotation, saving.

> **Summary:** Block 2 turns single calculations into an estimate: many work items, one consolidated
> shopping list that rounds up only once, and peso amounts that add up to the centavo. Custom lines
> mean a whole job can be priced even where Tantya has no calculator.
>
> **Gate:** stop and ask, "Shall I start Block 3, the quotation?"

## Block 3: Quotation: print and copy as text

**Feature:** turn the estimate into a quotation and send it, as a printed page or PDF, or as text pasted
into Messenger or Viber.

**What we build**
- `computeQuote(materials, settings)`, pure: labour (a percentage of materials, or a lump sum for
  *pakyaw*), contingency, markup, and VAT in three modes (none, 12% added on top, already included).
  The order of the sums is fixed once and printed on the quote.
- **Markup is shown as an amount on its own line**, which you can name (default "Overhead and profit").
  The percentage appears only in your settings, never on the quote.
- A header form: contractor, client, project, quote number, date, and "valid until", which defaults to
  30 days ahead and ends at the end of that day **in Manila**.
- A `QuoteDocument` component: materials table, summary, fixed terms text, signature lines, and a
  **disclaimer that cannot be switched off**.
- A print stylesheet (A4, the app's own buttons and bars hidden, table header repeated, rows never
  split) and a **Print / Save as PDF** button.
- `toPlainText(quote)` and a **Copy quote as text** button, because small contractors really do send
  quotes by chat.

**What you learn.** *The one new idea:* a document is not a screen: print CSS, and the first place jsdom
is blind. *Also:* percentages in basis points; tests that loop over every value; mocking browser
features; treating legal wording as a tested requirement.

**Testing phase**

| ID | Proves |
|---|---|
| B3-T1 | `computeQuote` goldens: all zeros; labour at 35% of ₱100,000.00 is ₱35,000.00; labour at 35% of ₱50,000.90 is **₱17,500.32** (the float version gives 1,750,031 centavos); one worked example pins the order of contingency and markup |
| B3-T2 | VAT: "on top" is 12% rounded half-up. For "already included", net is total × 100 ÷ 112 rounded half-up and VAT is the rest; a loop over every total from 1 to 20,000 centavos asserts net + VAT = total. Mode "none" produces no VAT field at all |
| B3-T3 | "Valid until": with the clock pinned to **00:30 Manila on the 1st of a month** (still the last day of the previous month in UTC), and again at 23:30 Manila on a month end, the date is right under both `test` and `test:utc` |
| B3-T4 | `toPlainText`: an exact expected string, not a snapshot. No VAT line in mode "none". Long descriptions wrap the same way every time |
| B3-T5 | **Round trip through the page:** render `QuoteDocument`, read every displayed amount back with `parsePeso`, and assert the lines add up to the displayed total, in every VAT mode. The markup percentage appears nowhere in the document |
| B3-T6 | The disclaimer is present under every combination of settings. The table has a real `thead`, `tbody` and `tfoot` |
| B3-T7 | Printing with no client name is blocked and lists what is missing. Otherwise Print calls `window.print` exactly once (`jest.spyOn(window, 'print')` with an empty stand-in; jsdom's own `print` only logs "not implemented") |
| B3-T8 | Copy: after `userEvent.setup()`, press Copy, and `navigator.clipboard.readText()` gives the exact text. (user-event installs its own clipboard and throws away any mock made before `setup()`.) With the clipboard removed after `setup()`, or a `writeText` that is refused, a text box holding the text appears instead |
| B3-T9 | jest-axe on the form and on the document |

**Planted bugs:** net and VAT rounded separately (the loop goes red at 14 centavos); "valid until" built
from the device's local date parts (the 00:30 case goes red under `test:utc`); the disclaimer behind a
setting.

**Outside Jest, two hand checks that close with the block:**
- **PRINT-QA**, six items, on desktop Chrome and on Android Chrome ("Save as PDF"): fits A4; the header
  repeats on page 2; no row is split across pages; the app's buttons are gone; the peso sign prints;
  the disclaimer is on the page.
- **COPY-QA**, on your Android: press Copy, paste into Messenger and into Viber. The whole text arrives,
  the peso sign shows, and the lines are still readable in a chat font.

**Cut line:** copy as text goes to the Backlog, and v1 sends quotes as a PDF. Drops B3-T4, B3-T8 and
COPY-QA.

**Not in this block:** markup hidden inside unit prices; editable terms; saved quotes; CSV; client links.

> **Summary:** Block 3 finishes the job Tantya's tagline promises: the estimate becomes a quotation with
> labour, markup and VAT that add up exactly, ready to print or to paste into a chat. It is also where
> we meet the limit of Jest, so print layout and pasting get short, honest hand checklists.
>
> **Gate:** stop and ask, "v1's three features are done. Shall I run the v1 release steps?"

## v1 release (after Block 3)

Not a block, and **no new code is written here**. The steps: a README with screenshots and the known
limits; `npm run test:release` green (built in Blocks 1 and 2), which means every factor has been
checked against your book; PRINT-QA re-run on a quote that uses every work kind; someone who builds
looks over `docs/factors.md`; merge; tag `v1.0.0`; a GitHub Release; the live link checked on your
phone.

**Then put v1 in front of one real person** (a foreman, an engineer, a contractor in the family). What
they say re-plans v2. Claude asks, **"Shall we plan v2?"** After the re-plan is written into this file,
Claude stops, shows what changed, and asks again: **"The v2 plan is updated. Shall I start Block 4,
saved estimates?"** No yes, no Block 4.

---

# Version 2: A tool you come back to

Estimates survive on the device, and the calculator grows to cover steel and wall finishes, so one job
type (a hollow-block wall, fence or room) can be quoted from footing to paint.
*Re-planned when v2 starts.*

## Block 4: Saved estimates

**Feature:** close the tab, come back tomorrow, and your estimates are still there, with the prices
they were quoted at.

**What we build**
- An `EstimateStore` interface (list, get, save, delete) with a localStorage version. All saving goes
  through it, so Block 8 can put a cloud version behind it without touching a screen.
- A Zod-checked save file with a **format number**. Format 1 is born here, so there is nothing to
  migrate yet: `migrate()` exists with zero steps. One real format-1 save is committed as a fixture,
  for Block 5 to migrate.
- Autosave after a short pause; an Estimates list with open, rename, **duplicate as a template** (new
  ID, new quote number, dates reset) and delete with undo.
- An estimate saves the unit price it used on every line.
- **Never destroy user data:** an unreadable save is moved to a `.corrupt` key, not overwritten; a save
  from a newer app version opens read-only with a message.
- localStorage is read through `useSyncExternalStore`: React's hook for something that lives outside
  React, with a second function that says what the server should draw, so the first paint matches.

**What you learn.** Zod-checked saves are Tipon again, on purpose. *The one new idea:* a storage seam,
proven by one **contract suite** (tests written against the interface, which every implementation must
pass). *Also:* defensive saving (full storage, corrupt saves, saves from the future); fake timers;
hydration (React attaching to the HTML the server already sent) done properly; two tabs open at once.

**Testing phase**

| ID | Proves |
|---|---|
| B4-T1 | Save then load gives an equal estimate. A format-1 file passes through `migrate()` untouched. A file with no format number is treated as unreadable (see B4-T3) |
| B4-T2 | A future format number gives "too new", and `setItem` is never called |
| B4-T3 | Garbage JSON gives an empty state **and** the original text is kept under the `.corrupt` key |
| B4-T4 | `setItem` throwing a quota error (spied on `Storage.prototype`) shows a banner, keeps what is in memory, and doesn't crash |
| B4-T5 | Autosave: three quick edits make one write after the pause (fake timers, with user-event's `advanceTimers` set); unmounting writes anything pending |
| B4-T6 | Duplicate gives a new ID and quote number, and editing the copy never changes the original. Delete then undo restores the same ID |
| B4-T7 | Saved prices: change a sample price, reload, and an older estimate still shows the price it was quoted at |
| B4-T8 | Hydration: `getServerSnapshot` is tested as a plain function. Then `renderToString` with **empty** localStorage, seed localStorage with a saved estimate, and `hydrateRoot` with an `onRecoverableError` spy. The spy is never called and the estimate is on screen afterwards. (A plain `render()` can never fail this, so it isn't used) |
| B4-T9 | A `StorageEvent` from another tab refreshes the list |
| B4-T10 | **One contract suite for `EstimateStore`**, written so Block 8 can run it against the cloud store too |
| B4-T11 | Flow: create an estimate, leave, come back, and it is still there. Every earlier suite passes unchanged |

**Planted bugs:** read localStorage in a `useState` starting value (B4-T8's spy must fire); overwrite a
corrupt save; write on every keystroke.

**Outside Jest:** real localStorage on Android after the tab has been thrown away; private mode; two
real tabs.

**Cut line:** undo, rename and the two-tab refresh go to the Backlog, and delete asks "are you sure?".
Drops the undo half of B4-T6, and B4-T9.

**Not in this block:** a shared book of your own prices, cloud, export.

> **Summary:** Block 4 makes Tantya something you return to: estimates are saved on the device behind a
> storage interface, with a rule that user data is never silently destroyed. The contract suite written
> here is what lets the cloud slot in later without changing a screen.
>
> **Gate:** stop and ask, "Shall I start Block 5, steel?"

## Block 5: Steel: cutting list

**Feature:** list the bars you need cut, and get how many commercial bars to buy and how to cut them.
A wall can fill the list for you.

**What we build**
- A new work kind, `rebar`: rows of diameter, cut length, quantity and a label. The save file becomes
  **format 2**, so this block writes the first real migration (1 to 2).
- `planCuts(cuts, stockLengths, prices)`, in whole millimetres, using **first-fit decreasing**: sort
  the cuts longest first, put each into the first bar that still has room, and open a new bar when none
  has. It returns the bars to buy, the cutting pattern for each bar, the offcuts and the waste %.
- With several stock lengths ticked, it runs once per length and keeps the cheapest **single-length**
  plan. It never mixes lengths in one plan, and the screen says so.
- Weight from d² ÷ 162 kg per metre, shown as "approx." to 2 decimals.
- **Fill from a wall:** a wall item can generate its own rebar rows from the spacing of vertical bars,
  "a horizontal bar every N layers", the bar diameter, and a tie-wire allowance. Every value is
  editable and labelled **"from your plans"**. Tantya never presents a spacing as a standard.

**What you learn.** *The one new idea:* a heuristic (a good method, not a perfect one), built
test-first, checked by rules it must never break, and labelled honestly. *Also:* a real data migration;
adding a kind to a union and letting TypeScript list everything you must update.

**Testing phase**

| ID | Proves |
|---|---|
| B5-T1 | Ten cuts of 3.0 m from 6 m stock: 5 bars, no waste. Three cuts of 3.5 m: 3 bars from 6 m stock, but 2 bars when 7.5 m is allowed |
| B5-T2 | A cut of exactly 6000 mm fits a 6000 mm bar. A cut longer than the longest bar gives a named error that mentions a lap splice (two bars overlapped to act as one) and your engineer |
| B5-T3 | Rows with quantity 0 are ignored. Different diameters never share a bar. With two stock lengths priced, the cheaper single-length plan wins, a tie goes to less waste, and a mixed-length plan is never returned |
| B5-T4 | Weight for a 6 m bar: 10 mm is 3.70 kg, 12 mm is 5.33, 16 mm is 9.48, 20 mm is 14.81, 25 mm is 23.15 |
| B5-T5 | 200 seeded random cut lists: every cut is placed exactly once; no bar is overfilled; bars bought is at least the total length ÷ the longest stock length; the same input gives the same plan |
| B5-T6 | Fill from a wall: the generated rows match a hand-worked wall, and changing the spacing changes the rows |
| B5-T7 | `consolidate` merges steel lines by diameter and length. The format-1 fixture from Block 4 migrates to format 2 and loads; a file with rebar round-trips |
| B5-T8 | Screen: add rows, see "Buy 5 pcs", open a bar to see its pattern. One over-length row shows an inline error while the other rows still compute |

**Outside Jest:** the cutting pattern is readable on a phone. **Your part:** check the steel weight
table against your reference.

**Cut line, in this order:** first "fill from a wall" (drops B5-T6); then several stock lengths (drops
the 7.5 m half of B5-T1 and the price rule in B5-T3).

**Not in this block:** slab and column bars, bend allowances, a guaranteed best packing.

> **Summary:** Block 5 adds steel: a cutting list that packs your cuts into the bar lengths a supplier
> really sells, which a wall can fill for you, so a fence quote is no longer missing its bars. It is
> the first algorithm in the project, tested by rules that must hold for any input.
>
> **Gate:** stop and ask, "Shall I start Block 6, wall finishes?"

## Block 6: Wall finishes: plaster and paint

**Feature:** finish the wall you already entered. Choose the plastered faces and the coats of paint,
and get cement, sand and the cheapest mix of paint cans.

**What we build**
- **Plaster**, as new fields on the wall item: 0, 1 or 2 faces and a thickness, giving cement and sand
  from a factor table with sources, like mortar.
- **Paint**, a new kind: the area comes from the wall (openings already taken out) or is typed in;
  coats; and coverage **as printed on the can** (often a range per 4 L; use the low end). Primer and
  topcoat are separate lines. The save file becomes **format 3**.
- `pickCans(millilitres, sizes, prices)`: the cheapest mix of 1 L, 4 L and 16 L containers that covers
  the need.

**What you learn.** *The one new idea:* the **brute-force oracle**. Brute force would be fast enough
here. We still write the smarter version (a small table of "cheapest way to cover n tenths of a litre",
filled from 0 upward), because the point is the habit: when you have a slow version you trust, make the
fast one agree with it on every input. Block 5 was good-not-best, checked by rules. Block 6 is best,
checked against brute force. *Also:* trade units that don't match metric inputs; a second migration.

**Testing phase**

| ID | Proves |
|---|---|
| B6-T1 | Plaster: faces 0, 1 and 2 scale only the plaster lines, never the blocks or the mortar. Every thickness × class factor exists and has a source |
| B6-T2 | Paint: 45 m² × 2 coats at 10 m² per litre is 9 L. With sample prices of ₱200, ₱700 and ₱2,400, the answer is **two 4 L cans and one 1 L can** (₱1,600) |
| B6-T3 | A need of 15 L returns **one 16 L pail** (₱2,400). That beats three 4 L plus three 1 L (₱2,700, the answer a "largest can first" method gives) and four 4 L (₱2,800) |
| B6-T4 | **Oracle loop** over whole millilitres, from 100 mL to 40,000 mL in 100 mL steps: the litres supplied always cover the need, and no cheaper mix exists by brute force |
| B6-T5 | Area 0 gives no cans. Coverage 0 gives an error. Openings bigger than the area give an error |
| B6-T6 | A format-2 file (no plaster, no paint) migrates and loads; a file with plaster fields and a paint item round-trips. Every earlier suite passes unchanged |
| B6-T7 | Screen: primer and topcoat appear as separate purchase lines, the can mix is shown with its working, and jest-axe finds nothing |

**Outside Jest:** check one real paint can's label against the coverage field's wording. **Your part:**
check each plaster factor against your book and fill in `docs/factors.md`.

**Cut line:** plaster goes to the Backlog; a custom line covers it. It repeats Block 1's mortar lesson,
while paint and `pickCans` carry the new idea. Drops B6-T1 and the plaster half of B6-T6.

**Not in this block:** tiles, ceilings, texture paints.

> **Summary:** Block 6 completes the wall: plaster and paint are added to the item you already measured,
> and a small optimiser picks the cheapest mix of cans. Its tests introduce the brute-force oracle, the
> strongest way in this plan to prove an optimiser is right.
>
> **Gate:** stop and ask, "v2's three features are done. Shall I run the v2 release steps?"

## v2 release (after Block 6)

The same steps as v1, with no new code, tagged `v2.0.0`. PRINT-QA is re-run on a quote with steel,
plaster and paint lines, and `test:release` now covers the plaster factors and the steel weights.

Claude asks, **"Shall we plan v3?"** After the re-plan is written into this file, Claude stops, shows
what changed, and asks again: **"The v3 plan is updated. Shall I start Block 7, export?"** No yes, no
Block 7.

---

# Version 3: Out of one phone

Get the numbers into Excel and the share sheet, back them up to your account, and send the client a
frozen link. This is the first server code in Tantya. *Re-planned when v3 starts.*

## Block 7: Export: CSV and the share sheet

**Feature:** send the estimate to Excel, or share it straight from your phone.

**What we build**
- `toCsv(lines, totals)`: proper quoting, Windows line endings, a byte-order mark so Excel shows ₱ and ñ
  correctly, and amounts built from centavos without floats.
- A **formula-injection guard**. Excel runs any cell that starts with `=`, `+`, `-` or `@` as a formula,
  so an item named `=HYPERLINK(...)` becomes a live link when the contractor opens the file. Text cells
  that start with one of those, a tab or a carriage return are made harmless. Amount cells are plain
  numbers and are never touched, so `-500.00` stays a number.
- Two buttons: **Download CSV** (always there) and **Share** (shown only when
  `navigator.canShare({ files })` says the device can). Desktop Chrome can share too, so this cannot be
  decided by "is it a phone". No server is involved.

**What you learn.** *The one new idea:* a file is bytes, not text (byte-order mark, line endings), and a
harmless-looking CSV can carry an attack. *Also:* feature detection instead of device guessing.

**Testing phase**

| ID | Proves |
|---|---|
| B7-T1 | A description with a comma, a double quote and a line break is quoted correctly. A custom item named `=HYPERLINK(...)` is made harmless, and an amount of `-500.00` is left alone |
| B7-T2 | The first three bytes are `EF BB BF` (node environment). "Parañaque" survives. 125050 centavos prints as `1250.50` |
| B7-T3 | The totals rows equal `computeQuote`'s output. An empty estimate gives the header row only. Line endings are `\r\n` |
| B7-T4 | Share: `navigator.share` and `canShare` are assigned as mocks (jsdom has neither). The button is hidden when `canShare` says no. Share is called with the file, and its bytes are read back with `FileReader`. A cancelled share (`AbortError`) shows no error; any other failure shows a message and Download still works |
| B7-T5 | Download: `URL.createObjectURL` and `revokeObjectURL` are assigned as mocks, the link's click is stubbed so jsdom does not try to navigate, and `revokeObjectURL` is called afterwards |

**Outside Jest:** open the file once in real Excel and in Google Sheets; use the real Android share
sheet.

**Cut line:** no share sheet, download only. Drops B7-T4.

**Not in this block:** XLSX, importing a CSV back in.

> **Summary:** Block 7 gets the numbers off the phone: a CSV that opens correctly in Excel and is safe
> against formula injection, plus the share sheet where the device has one. Jest checks the bytes; a
> person opens the file once.
>
> **Gate:** stop and ask, "Shall I start Block 8, accounts and cloud backup?"

## Block 8: Accounts and cloud backup

**Feature:** sign in, and your estimates are backed up and follow you to another device. Signed out,
everything works exactly as before.

**Set up by hand first** *(you do this; Claude walks you through it and never sees the keys):* a new
Supabase project (check the free-tier project limit; Habibit uses one), its keys in `.env.local` (not
committed) and in Vercel's settings, and a custom SMTP sender so sign-in emails reach anyone but you.
Habibit still lacks the last two.

**What we build**
- Supabase, as in Habibit v2: email sign-in, and one `estimates` table where each row can only be read
  by its owner.
- `CloudEstimateStore`, implementing Block 4's `EstimateStore`.
- `mergeStores(local, remote)`, pure: the newer `updatedAt` wins. Deletes travel as **tombstones**: a
  small "this was deleted at time T" marker kept in place of the row, so the other device learns about
  the delete instead of sending the estimate back.
- A sync status indicator with retry.

**What you learn.** Most of this block is Habibit v2 again, on purpose. *The one new idea:* a second
implementation passes the exact contract suite from Block 4, so no screen changes. *Also:* a sync
policy written as a pure function; deciding what belongs in unit tests and what needs a hand check.

**Testing phase**

| ID | Proves |
|---|---|
| B8-T1 | `mergeStores` table: only local; only remote; local newer; remote newer; equal times with a fixed tie-break; a tombstone against an older edit |
| B8-T2 | Merging twice changes nothing more, and frozen inputs are never changed in place |
| B8-T3 | Remote rows go through the same Zod schema. A bad row is skipped and reported, with no crash |
| B8-T4 | **Block 4's contract suite runs against the cloud store** (on a hand-written fake client). A rejected request shows the banner and retry |
| B8-T5 | **Signed out, every earlier suite (Blocks 1 to 7) passes unchanged.** That is the proof the app is still local-first |
| B8-T6 | Screen: the sign-in button's states and the sync indicator's states |

**Outside Jest:** on this block's preview link with two real accounts, account B cannot read account A's
rows; a real sign-in email arrives. Reusing Habibit's local-Supabase database tests is decided when v3
is planned.

**Cut line:** no tombstones. The cost, said plainly on screen: while signed in, a deleted estimate comes
back on the next sync. Goes to the Backlog. Drops the tombstone case in B8-T1.

**Not in this block:** teams, sharing an estimate, social sign-in.

> **Summary:** Block 8 adds optional accounts: estimates back up to Supabase and merge with whatever is
> on the device, behind the same storage interface the screens already use. The strongest test is the
> quiet one: signed out, every earlier test still passes unchanged.
>
> **Gate:** stop and ask, "Shall I start Block 9, the client quote link?"

## Block 9: Client quote link

**Feature:** send the client a read-only link to a **frozen** copy of the quote. It shows when the quote
has expired, and you can revoke it.

**What we build**
- `buildSnapshot(estimate)`: **exactly what the printed quote shows** (lines, unit prices, the labour,
  contingency, markup and VAT lines, totals, header, "valid until", the disclaimer) and nothing else.
  No work items, no "which items feed it", no settings, no markup percentage.
- Creating a link needs a signed-in user, so there is no open write endpoint. Only a SHA-256 hash of
  the token is stored, so someone who reads the database cannot turn a row back into a working link.
- **How a client with no account reads it:** the page runs on the server and looks the row up by token
  hash through one server-only path (a database function that accepts only a token hash, or a secret
  key kept in Vercel). The browser never gets that key. Which of the two is chosen when v3 is planned.
- The public page `/q/[token]` renders the same `QuoteDocument` used for printing. It exports a static
  `metadata` with `noindex` (tells search engines not to list it), shows "Expired on …" after the end
  of the valid-until day in Manila, and shows nothing at all once revoked.
- **The thin-page rule:** the `async` page file only loads data. A plain, synchronous component does all
  the drawing, so React Testing Library can test it fully. The lookup finishes before anything streams
  (no `loading.tsx`, no `<Suspense>` above it), so a bad token is a real 404.

**What you learn.** *The one new idea:* a thin `async` page over a frozen snapshot. *Also:* immutability
as a business rule (a quote is a commitment); secure tokens; leaking nothing; Tantya's first Playwright
test, and your first against a page drawn on the server.

**Testing phase**

| ID | Proves |
|---|---|
| B9-T1 | The snapshot's totals equal `computeQuote` at the moment of freezing. After changing the estimate and the prices, the snapshot hasn't changed (it is deep-frozen: nothing inside it can be altered) |
| B9-T2 | Every key in the snapshot is on a written allow-list. A planted extra field (`settings`, `feeds`) fails the test |
| B9-T3 | `isExpired`: 23:59:59 Manila on the valid-until date is not expired; 00:00:00 the next day is. Same result under `test:utc` |
| B9-T4 | Token (node environment): URL-safe; 1,000 tokens are all different; `crypto.getRandomValues` is used and `Math.random` is never called; only the SHA-256 hash is stored |
| B9-T5 | `loadSnapshotView` with a fake repository: revoked returns a status and no data fields; unknown returns not-found; expired returns the data plus a flag |
| B9-T6 | The read-only document has no inputs and no buttons, keeps the disclaimer, and shows the expired banner. B3-T5's add-up check is run again on it |
| B9-T7 | The page's static `metadata` export has `index: false` and `follow: false` |

**Outside Jest, by hand:** open a real link on your Android in a private tab (signed out); revoke it and
reload, and nothing shows; with the public key, a direct select on the snapshots table returns no rows;
read the route table printed by `next build`.
**If you say yes to Playwright:** one smoke test. A seeded token renders (from a fake repository
switched on by an environment variable in the test run); a bad token gives status 404; a print-media
check automates three PRINT-QA items (buttons gone, disclaimer present, peso sign present). "Fits A4",
"header repeats" and "no split rows" stay hand checks.

**Cut line, in this order:** first the Playwright check; then revoke (drops the revoked case in B9-T5,
and the summary then says "expiring", not "revocable").

**A possible swap when v3 is planned:** "Actuals vs estimate" (log real purchases against each line and
see the difference) has more everyday value to a contractor. Block 8 is mostly a repeat and Block 9 has
the most to teach, but Block 9 needs Block 8's sign-in. If the swap comes in, it replaces Block 9 and
the link goes to the Backlog.

> **Summary:** Block 9 is the capstone: a frozen, revocable, read-only quote page on the server that
> shows the client exactly what the printed quote shows and nothing more. It teaches the thin-page
> pattern and, if you say yes, brings in a small Playwright check for what Jest cannot reach.
>
> **Gate:** stop and ask, "v3's three features are done. Shall I run the v3 release steps?"

## v3 release (after Block 9)

The same steps as v1, with no new code, tagged `v3.0.0`. Two extra steps: you set the Supabase keys in
Vercel yourself, and Block 8's two-account check is repeated on the live site. Then Claude asks, **"All
nine features are shipped. What next?"** Nothing starts without a yes.

---

## Decisions

Each 🟡 row is a **recommendation, not a decision**. Claude asks about it at the gate before its
"decide before" block, and that block does not start while one of its rows is still open.

| Decision | Recommendation | Decide before | Status |
|---|---|---|---|
| The product | **Tantya**, the estimator. A panel of three judges scored four ideas (see the last section) | Block 0 | ✅ kept when the repo was created, 2026-09-21 |
| Name | **Tantya**. Also considered: **Sukat** (*measure*). It becomes the repo and the URL | Block 0 | ✅ kept when the repo was created, 2026-09-21 |
| A setup block outside the three features | Yes: Block 0. The other choice is folding setup into Block 1, which makes Block 1 too big | Block 0 | ✅ agreed 2026-09-21 |
| What counts as one feature | One new thing a user can do, with one way in. Three blocks put two closely tied parts behind that one way in: **1** (wall + concrete, one form with a switch), **5** (cutting list + "fill from a wall"), **6** (plaster + paint, one "finish this wall" panel). This needs your explicit yes. On a strict reading, Blocks 5 and 6 take their cut lines from the start, and Block 1 ships walls only, with new worked examples and concrete moved to the Backlog | Block 0 | ✅ agreed 2026-09-21: two tied parts behind one way in is one feature. Block 1 ships wall **and** concrete |
| Test tools | Jest 30 + React Testing Library + user-event + jest-axe. Playwright in Block 9 only, after asking | Block 0 | ✅ agreed 2026-09-21 |
| Exact maths | `BigInt` inside the engine. Plain numbers for money, behind a guarded limit | Block 0 | ✅ agreed 2026-09-21 |
| Look and feel | **Site clipboard:** light and high-contrast for sunlight, big number fields, numbers in aligned columns, one safety-yellow accent. Others: **Blueprint** (deep blue, thin white lines) or **Receipt** (monospace on paper) | Block 0 | ✅ agreed 2026-09-21: **Site clipboard** |
| How work is pushed | One branch per block (`block-4-saved-estimates`). Pushing it runs CI and gives a Vercel preview link for the hand checks. It is merged to `master` only after your yes at the gate, so the live site is always the last block you approved | Block 0 | ✅ agreed 2026-09-21 |
| Reference for factors | One you trust, such as Fajardo's *Simplified Construction Estimate*. Every factor is checked by hand and cited. Tantya includes only the factors it uses | Block 1 | 🟡 |
| Where data lives | v1 memory · v2 this device · v3 Supabase as well | Blocks 2, 4, 8 | 🟡 (v1 in memory confirmed 2026-09-21; v2 and v3 still open) |
| How the public quote page reads the database | A database function that accepts only a token hash | Block 9 | 🟡 |

## Known limits (on purpose)

| Limit | Why | Plan |
|---|---|---|
| **Tests cannot prove the factors are right.** They prove the code matches the table, not that the table matches reality | No test can know how much cement a wall takes | Sources in `docs/factors.md`, the "unverified" chip, your hand check, `test:release`, and a look from someone who builds before each release |
| v1 forgets everything on refresh | No saving until Block 4 | The PDF or the pasted text is the record |
| Prices go stale and differ by region | There is no free price feed | Sample prices are labelled and dated, and every price can be changed |
| Sand and gravel are rounded to 0.5 m³ | Suppliers differ: whole m³, truckload, sack | The step is a setting, labelled "ask your supplier" |
| Print layout can't be tested by Jest | jsdom has no layout engine | PRINT-QA by hand in Block 3 and at every release; partly automated by Playwright in Block 9 if you say yes |
| The cutting list is good, not best | First-fit decreasing is a heuristic, and lengths are never mixed | The screen says so |
| A free Supabase project may pause when idle (verify) | Free-tier terms | It would break client links, so decide on a keep-alive or a paid tier before Block 9 |
| Not installable, not offline | You already learned PWAs in Habibit, so it is left out of the nine | A cheap add later |

## Backlog

Cut work lands here, and so do ideas. Nothing here is a fourth feature. If something is wanted, it
**replaces** a feature when a version is re-planned.

| Item | From |
|---|---|
| Tiles. The idea to keep: count by area **and** by grid, and use the larger. A 2.5 × 2.5 m room with 60 cm tiles needs 18 by area (20 with 10% wastage) but 25 by grid | First candidate for v4 |
| A shared book of your own prices, with a flag when they are over 30 days old | Narrowed out of Block 4 |
| Markup hidden inside unit prices (needs a way to spread leftover centavos so the lines still add up) | Left out of Block 3 |
| "Actuals vs estimate" | The possible swap for Block 9 |
| Mixed stock lengths in one cutting plan | Block 5's limit |
| *(cut-line items are added here as they happen)* | |

**Never planned:** imperial inputs (`'10ft'` is refused, never guessed); DPWH or government bid formats;
structural design of any kind; live prices, supplier ordering, teams. Roofing, formworks, ceilings,
electrical and plumbing are covered by custom lines.

## The disclaimer (printed on every quote, tested, never removable)

Quantities are estimates for budgeting, not structural design. Concrete class, bar sizes, spacing and
splice lengths come from the plans or a licensed engineer. A quotation is not an official receipt or
invoice. Prices are valid only until the date shown. *The final wording is settled in Block 3.*

## Rules carried over from Habibit, Sipat and Tipon

- **Logic is pure and lives apart from the screens.** IDs and the clock are passed in, so tests give the
  same result every run.
- **Every write goes through one reducer.** A refused or empty change returns the same object.
- **A component either draws something or runs an effect**, not both.
- **Swappable parts sit behind interfaces:** factor tables (Block 1), storage (Blocks 4 and 8).
- **Quote dates use Manila calendar parts:** add 8 hours to the timestamp and read the UTC parts (the
  Philippines has no daylight saving). Never `toISOString()`, and never the device's own timezone, so
  your phone, CI, the Vercel server and an OFW's phone abroad all agree.
- **Never destroy user data silently.**
- **Test devices:** Android Chrome and desktop Chrome must pass. iOS should work but never blocks a release.
- **Next.js 16 differs from older guides.** Read `node_modules/next/dist/docs/` before writing code.

## Words used in this guide

| Word | Meaning |
|---|---|
| **CHB** | Concrete hollow block, sold by nominal inch size. 4, 5, 6 and 8 inch are 100, 125, 150 and 200 mm thick |
| **Class** | The mix ratio. A richer class uses more cement per m³. Concrete has classes AA to C and mortar has A to D; the letters overlap but the mixes differ. It comes from the plans |
| **Factor** | How much material one unit of work takes, such as 12.5 blocks per m² |
| **Net or includes-allowance** | Whether a book's factor already has waste built in, so wastage is not added twice |
| **Purchase step** | The smallest amount a store sells: 1 bag, 1 piece, 0.5 m³ |
| **Basis point** | One hundredth of a percent. 5% is 500 |
| **Golden test** | A test whose expected answer was worked out by hand first and is never changed to fit the code |
| **Seeded** | Random numbers that start from a fixed number, so a failure can be replayed exactly |
| **Oracle** | A slow, obviously correct version that the fast version must always agree with |
| **jsdom** | The pretend browser Jest runs screen tests in. It has a page structure but no layout, no printing and no clipboard |
| **Hydration** | React attaching to the HTML the server already sent. If the two disagree, React complains |
| **Storage seam** | One interface all saving goes through, so what sits behind it can be swapped |
| **Contract suite** | One set of tests written against an interface and run against every implementation of it |
| **Tombstone** | A small "this was deleted" marker that syncs like an edit |
| **Lap splice** | Two bars overlapped and tied to act as one longer bar. The overlap length is the engineer's call |
| **Pakyaw** | Labour priced as one lump sum for the job |

## Block note template (`docs/blocks/block-N.md`)

```
# Block N: <title>
**Status:** ✅ done · <count> tests passing · CI green

## What we built          files, and what each one is
## The one new idea       in your own words, after the walkthrough
## Other ideas to take away
## Decisions made         what we chose, and why
## Deviations from the plan    including any earlier test that had to change, and your yes
## Worked examples        links into docs/worked-examples.md: your working, Claude's, and the match
## Testing phase          every row ID from PLAN.md → the file that proves it (⏭️ for cut rows)
## How we know the tests work    each planted bug → how many tests failed
## Checked outside Jest   ✅ / ❌ / ⏭️, who ran it, reported honestly
## Deliberately NOT in this block
## Summary                one to three sentences
## Gate                   the question asked, and your answer
```

## Other directions the panel considered

Four product ideas were drafted, each by a separate agent, then scored by three judges (learning path,
testability, real-world value). Out of 30:

| Idea | Score | In one line | Why it didn't win |
|---|---|---|---|
| **Tantya**, estimator | **24.5** | Measurements in, quotation out | Won. Useful to one real person on day one, and its main risk sits where Jest can see it |
| **Tala**, site diary and punch list | 19.5 | Log the day, list the defects, show progress | v1 mostly repeats Habibit, Sipat and Tipon, and its real value needs a whole team to adopt it |
| **Hulog**, house listings with a payment calculator | 19.5 | Find the house, know the monthly | The best lesson plan of the four, but it needs real listings and photos, and has the weakest tie to construction |
| **Haligi**, site for a construction firm | 15.5 | Portfolio, guided inquiry, client status page | Built on `async` Server Components, which Jest can't render, and worthless without a real firm and its photos |

If one of these is closer to what you had in mind, say so before Block 0 and this guide gets redrawn
with the same rules.
