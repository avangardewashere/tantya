# Tantya

**Sukat in, quotation out.**

A phone-first materials and cost estimator for small Philippine construction jobs. You type real
measurements. It tells you what to actually buy — whole hollow blocks, 40 kg cement bags, cubic metres
of sand — prices it in pesos, and lays it out as a quotation you can print or paste into Messenger.

*Tantya*, from the Tagalog *tantiya*: an estimate. The sum a foreman does in their head before
ordering materials.

## Status

**Block 0 of 9 complete.** The workshop is built; the product is not. There is no calculator yet —
Block 1 brings it. What exists today is the foundation every later answer rests on.

The full plan, block by block, is in [`docs/PLAN.md`](docs/PLAN.md).

## Why whole numbers

In JavaScript, `0.1 * 3 * 10` is `3.0000000000000004`. So a 3 m × 10 m slab 100 mm thick, at 9 bags of
cement per cubic metre, rounds up to 28 bags instead of 27.

That is the bug this project is built to make impossible. **28 bags looks exactly as believable as
27** — there is no crash, no red text, nothing to notice. So nothing here is ever a float:

| Thing | Stored as |
|---|---|
| Lengths | whole millimetres (`'2.70'` is `2700`) |
| Factors | whole millionths (12.5 blocks per m² is `12_500_000`) |
| Percentages | basis points (5% is `500`) |
| Quantities inside the engine | exact fractions, `BigInt` over `BigInt` |
| Quantities to buy | whole thousandths, rounded **up**, **once**, at the purchase line |
| Money | whole centavos |

## Running it

```bash
npm install
npm run dev          # http://localhost:3004
```

## Checking it

```bash
npm test             # the suite, pinned to Asia/Manila
npm run test:utc     # the same suite in UTC, the way CI runs it
npm run lint
npm run typecheck
npm run build
```

Two timezone runs, not one. GitHub's machines run on UTC, 8 hours behind Manila, so between midnight
and 8 a.m. Manila time "today" is a different date there. Date code that is right in only one zone is
wrong. There is no date code until Block 3; the second run is wired now so it can never be forgotten.

## How it is laid out

```
src/engine   pure maths — no React, no Next, enforced by a lint rule and proven by a test
src/money    centavos in, pesos out                              (Block 2)
src/quote    labour, markup, VAT, the printed document           (Block 3)
src/store    saving, behind one interface                        (Blocks 4 and 8)
src/ui       components
src/app      routes
```

`src/engine` is walled off so the maths can be tested with no pretend browser in the way, and reused
on the server in Block 9 without dragging a screen along.

## What it will not do

No imperial input — `'10ft'` is refused, never guessed. No government (DPWH) bid formats. No
structural design of any kind: Tantya counts materials for a design someone else is responsible for.
No live prices, no supplier ordering.

Prices are samples, labelled and dated, and every one of them can be changed.
