# Block 0: Groundwork

**Status:** ✅ built · 55 tests passing in both timezones · lint, typecheck and build green locally ·
**CI not yet observed green** (this is the first push that runs it) · **Vercel not yet connected**
(you are doing that after this block)

Setup is not a feature — no user can do anything with it — so it sits outside the three. It still
followed the loop: worked examples, test rows, build, testing phase, summary, gate.

## What we built

| File | What it is |
|---|---|
| `src/engine/units.ts` | The units, as branded whole-number types: `Millimetres`, `Millionths`, `BasisPoints`, `Centavos`, `Thousandths`. The brands cost nothing at runtime and stop a length being passed where a price is wanted |
| `src/engine/fraction.ts` | The exact-fraction type: a `BigInt` numerator over a `BigInt` denominator, with `multiply`, `add`, `compare`, `ceilToThousandths` and `toDecimalString`. Division is never implicit |
| `src/engine/parse-metres.ts` | `parseMetres`: text in, whole millimetres out, or a named refusal. Ten refusal codes, no guessing |
| `src/engine/round.ts` | `roundUpToStep`: rounding up by remainder, never by division |
| `src/engine/index.ts` | The ruler, in one import |
| `src/ui/app-shell.tsx` | Masthead, working area, disclaimer. In `src/ui` and not in the layout so a test can render it alone |
| `src/app/globals.css` | The Site clipboard look, as CSS variables |
| `src/app/layout.tsx`, `src/app/page.tsx` | Three lines of plumbing, and a placeholder page |
| `jest.config.ts`, `jest.setup.ts` | Jest through `next/jest`, jsdom by default, and the timezone pin |
| `scripts/test-in-timezone.mjs` | `npm run test:utc`, and a loud failure on an unknown timezone |
| `scripts/lint-probe.mjs` | Lints snippets against the real config, for B0-T3 |
| `eslint.config.mjs` | The wall around `src/engine` |
| `.github/workflows/ci.yml` | lint · typecheck · test · test:utc · build |
| `.gitattributes` | LF in the repo; fixtures and CSVs left alone, for Block 7 |
| `docs/factors.md` | Empty on purpose. The rules for filling it, and why no test can |
| `docs/worked-examples.md` | Block 0's examples, Claude's column filled, yours waiting |
| `docs/disclaimer.md` | The draft wording, and what each sentence protects against |

## The one new idea

*(Your words, after the walkthrough. The idea is: whole numbers as the ruler, behind a lint rule that
walls the maths off from React.)*

## Other ideas to take away

- **A test that only tests the code is worth less than you think.** B0-T4's expected values were
  written down before `parseMetres` existed. Had the code come first, `1004` would have looked right.
- **Two timezone runs, wired before any date code exists.** It is boring until Block 3, which is
  exactly why it had to be wired now.
- **A lint rule nobody proves is a comment.** B0-T3 runs ESLint over a file that breaks the wall and
  expects one error — and over the same import in `src/ui`, where it is ordinary, so a rule that
  banned React everywhere would not pass either.
- **Measure the claim.** The stylesheet claimed 16.1:1 contrast. Measured, it is 17.4:1, and the
  danger colour was 7.4:1 rather than the 6.2:1 written down. Both comments were corrected to the
  measured figures.

## Decisions made

| Decision | Why |
|---|---|
| `parseMetres` returns a result union; `roundUpToStep` throws | Two different kinds of wrong. Bad text is a person typing, and Block 1's form has to render it as an inline `role="alert"`. A negative quantity or a step of zero is a bug upstream, and should stop the run |
| Fractions carry their own denominator | See deviation 2 |
| Lengths capped at 1 km (`TOO_LARGE`) | Longer than any job Tantya is for, short enough to catch a slipped decimal point |
| System fonts, not `next/font/google` | One less thing needing the network at build time, and the numeric stack gets `tabular-nums slashed-zero`, which is what the aligned columns actually need |
| One light theme, no dark mode | A dark theme in direct sunlight is unreadable, and this app is used outdoors |
| CI is one job with five named steps | A failure names itself in the log without paying `npm ci` five times |
| CI does **not** set a timezone | The runner is UTC. `npm test` going green there proves the Manila pin works on a machine 8 hours behind, rather than assuming it |

## Deviations from the plan

| # | Deviation | Why | Needs your yes? |
|---|---|---|---|
| 1 | Built on `claude/repo-review-v0-plan-k2n95x`, not `block-0-groundwork` | This session is pinned to that branch and may not push elsewhere without your say-so. The plan's decision is one branch per block | **Yes** — say the word and Block 1 starts on `block-1-materials-calculator` |
| 2 | A fraction carries its own denominator, rather than every value sharing one fixed denominator | A single global denominator has to divide on every multiply, and that division truncates. Rounding would then happen on every sum instead of once at the purchase line — the rule Block 1 exists to protect. `BigInt` has no size limit, so letting denominators grow costs nothing | No, but worth knowing |
| 3 | B0-T3 runs ESLint in a child process, through `scripts/lint-probe.mjs` | ESLint loads `eslint.config.mjs` with a dynamic `import()`, which Jest refuses without `--experimental-vm-modules`. Shelling out also means the test measures the same ESLint CI runs | No |
| 4 | `TOO_LARGE` is a tenth refusal code, not in B0-T4's list | A guard, not a behaviour change. Named here so it is not a surprise later | No |
| 5 | `tsconfig` target raised to ES2022 | `BigInt` literals like `1000n` are a syntax error below ES2020 | No |
| 6 | `.claude/launch.json` was written from scratch | I have not seen Habibit's, Sipat's or Tipon's copy. Compare it with one of theirs and correct the shape if it differs | **Worth a look** |

No earlier test had to change: there are no earlier tests.

## Worked examples

[`docs/worked-examples.md`](../worked-examples.md) — Block 0.

**Claude's column is filled. Yours is empty.** Every row is ⏳ until you work it. The two that matter
most are `'1.005'` → 1005 mm and 2260 at a step of 500 → 2500; the rest are quick. Until then, what
the suite proves is that the code agrees with *one* author — the exact weakness the two-column rule
exists to remove.

## Testing phase

| ID | Proves | Where |
|---|---|---|
| B0-T1 | The shell renders a heading "Tantya", and jest-axe finds nothing | `src/ui/__tests__/app-shell.test.tsx` |
| B0-T2 | The offset is −480 minutes under `test` and 0 under `test:utc` | `src/engine/__tests__/timezone.test.ts` |
| B0-T3 | ESLint on a `src/engine` file importing React gives exactly one error | `src/engine/__tests__/lint-wall.test.ts` |
| B0-T4 | `parseMetres`: the three good cases, and nine refusals by name | `src/engine/__tests__/parse-metres.test.ts` |
| B0-T5 | `roundUpToStep` on whole numbers; the `Math.ceil(0.7 / 0.1) * 0.1` counter-example | `src/engine/__tests__/round.test.ts` |
| B0-T6 | The float trap at the ruler: `0.1 * 3 * 10`, and 3,000,000,000 mm³ exact | `src/engine/__tests__/round.test.ts` |
| B0-T7 | CI green: lint, typecheck, test, test:utc, build | `.github/workflows/ci.yml` — **green locally, not yet observed on GitHub** |

`npm test` and `npm run test:utc`: **55 passing, 5 suites, both timezones.**

## How we know the tests work

Each bug was planted alone, the suite run, and the file restored.

| Planted bug | Tests turned red |
|---|---|
| `parseFloat` then multiply, in `parseMetres` | 2 — `"1.005" is 1005 mm`, and `does not lose the millimetre that the float version loses` |
| `Math.round` in place of rounding up, in `roundUpToStep` | 2 — `1 at a step of 500 is 500 — the smallest need still costs a whole step`, and `adds before it rounds, which is the whole point` |

Worth noting about the second: **the obvious rows survived it.** 2260 at a step of 500 still gave
2500, and 13.5 bags still gave 14, because `Math.round` happens to agree there. Only the small need
and the add-before-round case caught it. A suite of nice round examples would have passed this bug.

## Checked outside Jest

| Item | Result | Who |
|---|---|---|
| `npm run build` passes | ✅ Next 16.3.5, 3 static routes | Claude |
| Renders in desktop Chrome | ✅ 1280×800 | Claude, headless Chromium |
| Renders at phone width | ✅ 393×851 at DPR 3, **no sideways scroll** (`scrollWidth` 393 = `clientWidth`) | Claude, headless Chromium |
| Text contrast in Chrome | ✅ read off the live page. Ink 17.4:1, soft ink 7.4:1, danger 7.4:1, ink on accent 10.9:1 — all AAA. Accent-deep 4.7:1 (AA), focus rings only | Claude |
| The preview link opens on your Android | ⏭️ **blocked** — Vercel is not connected yet | You |
| Contrast outdoors, on the phone, in sunlight | ⏭️ **waiting on the preview link** | You |

The two ⏭️ items are ones the plan says close with the block. They are open because you chose to
connect Vercel after Block 0 rather than during it. **They stay open, and the gate names them.**

## Deliberately NOT in this block

Any calculator. Any factor. Prices. Saving. A wastage field. `npm run test:release` — it arrives in
Block 1, with the first factor it has something to check. Playwright. Supabase.

## Summary

Block 0 builds the workshop, not the product: a Next.js 16 app with Jest running in two timezones, a
lint wall that keeps React out of the maths, CI, the Site clipboard look, and a whole-number ruler —
`parseMetres`, `roundUpToStep` and an exact fraction — that every later calculation measures with. The
ruler is trusted before Block 1 starts because its examples were written down before its code existed,
and two planted bugs proved the tests can see them.

## Gate

> Groundwork is done: 55 tests green in both timezones, lint, typecheck and build clean, two planted
> bugs caught. Outside Jest: 4 ✅ (build, desktop Chrome, phone width, contrast), 2 ⏭️ — the Android
> preview and the sunlight check, both waiting on Vercel. Before Block 1 I need your yes on the
> reference book for factors.
>
> **Shall I start Block 1, the materials calculator?**

*Your answer:*
