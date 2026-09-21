# Worked examples

Every number that becomes a test is worked out **twice, separately**: once by you on paper or a
calculator, once by Claude. The two workings go here side by side and must match before the row is
written as a test.

The reason is in `PLAN.md`: if the same author writes the expected number and the code, a shared
mistake passes green. A test whose expected value was copied from the code's output proves only that
the code does what it does.

**Key:** ✅ both workings agree · ⏳ Claude only, waiting for your hand check · ❌ they disagree, stop
and find out why.

---

## Block 0: the ruler

### B0-T4 · `parseMetres`, the good cases

The rule: take the text apart as text, and put it back with whole numbers. Never multiply a decimal.

| Input | Whole part × 1000 | Decimal part, padded to 3 | Millimetres | Claude | You | Status |
|---|---|---|---|---|---|---|
| `'2.7'` | 2 × 1000 = 2000 | `'7'` → `'700'` = 700 | 2000 + 700 | **2700** | | ⏳ |
| `' 3 '` | 3 × 1000 = 3000 | none → `'000'` = 0 | 3000 + 0 | **3000** | | ⏳ |
| `'1.005'` | 1 × 1000 = 1000 | `'005'` = 5 | 1000 + 5 | **1005** | | ⏳ |

**The counter-example that makes `'1.005'` worth a row.** The obvious version is
`Math.trunc(parseFloat('1.005') * 1000)`. The nearest double to 1.005 is
1.00499999999999989341858963598497211933135986328125, so the product prints as
`1004.9999999999999` and truncates to **1004**. One millimetre gone before any real sum has started.

### B0-T4 · `parseMetres`, the refusals

Each of these gives a **named error**, never a number. Tantya never guesses what someone meant,
because a wrong answer downstream looks exactly like a right one.

| Input | Code | Why | Claude | You | Status |
|---|---|---|---|---|---|
| `'2,7'` | `COMMA_DECIMAL` | Is it 2.7 or 27? Nobody should have to guess | refuse | | ⏳ |
| `'3m'` | `UNIT_SUFFIX` | The unit is already metres | refuse | | ⏳ |
| `'10ft'` | `IMPERIAL` | Converting silently hides whose conversion it was | refuse | | ⏳ |
| `'1e3'` | `EXPONENT` | Almost always a slip, not an intention | refuse | | ⏳ |
| `''` | `EMPTY` | Nothing typed | refuse | | ⏳ |
| `'abc'` | `NOT_A_NUMBER` | Not a measurement at all | refuse | | ⏳ |
| `'-1'` | `NOT_POSITIVE` | A wall is not −1 m long | refuse | | ⏳ |
| `'0'` | `NOT_POSITIVE` | A wall is not 0 m long | refuse | | ⏳ |
| `'2.7005'` | `TOO_MANY_DECIMALS` | 2.7005 m is 2700.5 mm. Rounding it is the **user's** call | refuse | | ⏳ |

### B0-T5 · `roundUpToStep`

Both arguments are in the same whole unit. Quantities are in thousandths of a unit, so 2.26 m³ is
2260 and a half-cubic-metre step is 500.

Method: a remainder, never a division. `remainder = quantity % step`; if it is 0 the quantity already
sits on a step, otherwise add `step − remainder`.

| Quantity | Step | Remainder | Working | Claude | You | Status |
|---|---|---|---|---|---|---|
| 2260 (2.26 m³) | 500 (0.5 m³) | 2260 − 4×500 = 260 | 2260 + (500 − 260) | **2500** = 2.5 m³ | | ⏳ |
| 2500 (2.5 m³) | 500 | 0 | already on a step | **2500** | | ⏳ |
| 0 | 500 | 0 | nothing needed, nothing bought | **0** | | ⏳ |
| −1 | 500 | — | a need is never negative | **throws** | | ⏳ |
| 1000 | 0 | — | a step of 0 means the store sells nothing | **throws** | | ⏳ |

**The counter-example, recorded in the test.** `Math.ceil(0.7 / 0.1) * 0.1`:
`0.7 / 0.1` is `6.999999999999999`, which ceils to 7, and `7 * 0.1` is `0.7000000000000001`.
Two float errors, pulling in opposite directions, and neither cancels.

### B0-T6 · the float trap, at the ruler

| Sum | In floats | In whole numbers |
|---|---|---|
| `0.1 * 3 * 10` | `0.1 * 3` is `0.30000000000000004`, × 10 is **`3.0000000000000004`** | — |
| A 3 m × 10 m slab, 100 mm thick | — | 3000 × 10000 × 100 = **3,000,000,000 mm³**, exact |

Claude: **agrees with both**.  You: ⏳

3,000,000,000 mm³ is well inside what a plain number holds, but it is already
3 × 10⁹ for one small slab. Multiply by a factor in millionths (×10⁶) and a wastage in basis points
(×10⁴) and it is past 9 × 10¹⁵, where whole numbers stop being exact. That is why the engine's
quantities are `BigInt`.

### `Fraction`, the supporting cases

Not one of the plan's rows, but the fraction type is part of the ruler, so its answers are worked out
the same way.

| Call | Working | Claude | You | Status |
|---|---|---|---|---|
| `toDecimalString(101250/1000, 2)` | reduces to 405/4; 405 × 100 ÷ 4 = 10125, no remainder | **`'101.25'`** | | ⏳ |
| `toDecimalString(77625/1000, 3)` | reduces to 621/8; 621 × 1000 ÷ 8 = 77625 | **`'77.625'`** | | ⏳ |
| `toDecimalString(1/2, 0)` | 1 × 1 ÷ 2 = 0 remainder 1; 1 × 2 ≥ 2, so step up | **`'1'`** | | ⏳ |
| `ceilToThousandths(1/3)` | 1000 ÷ 3 = 333 remainder 1, so 334 | **334** | | ⏳ |
| `ceilToThousandths(101250/1000)` | 405 × 1000 ÷ 4 = 101250, exact | **101250** | | ⏳ |

---

## Block 1: the materials calculator

These use the **frozen test table**, not real factors. Frozen values are invented round numbers,
chosen so the arithmetic can be checked by hand; they are never shipped and never change, so
correcting a real factor later cannot turn the suite red.

| Frozen factor | Value |
|---|---|
| CHB blocks per m² | 12.5 pcs/m² |
| Mortar cement, 150 mm, class A | 1.018 bags/m² |
| Mortar cement, 200 mm, class A | 1.300 bags/m² |
| Mortar sand, 150 mm | 0.058 m³/m² |
| Mortar sand, 200 mm | 0.074 m³/m² |
| Concrete cement, class AA · A · B · C | 12 · 9 · 7.5 · 6 bags/m³ |
| Concrete sand, every class | 0.5 m³/m³ |
| Concrete gravel, every class | 1.0 m³/m³ |

Purchase steps: cement 1 bag, blocks 1 pc, sand and gravel 0.5 m³.

Claude's column was worked in exact rational arithmetic **before the engine existed**, so no value
here could have been read out of the code's output.

### B1-T1 · the float trap, in the engine

A slab 3 m × 10 m, 100 mm thick, class A. Inputs `'0.1'`, `'3'`, `'10'`.

| Step | Working | Claude | You | Status |
|---|---|---|---|---|
| Volume | 3000 × 10000 × 100 mm | 3,000,000,000 mm³ | | ⏳ |
| In cubic metres | ÷ 1000³ | exactly **3 m³** | | ⏳ |
| Cement | 3 × 9 bags/m³ | exactly **27 bags** | | ⏳ |
| The float version | `Math.ceil(0.1 * 3 * 10 * 9)` | **28** — one bag too many | | ⏳ |

**This golden is not enough on its own, and that was found by planting the bug.** Floating-point
multiplication is order-dependent: `0.1 * 3 * 10` is `3.0000000000000004`, but `3 * 10 * 0.1` is
exactly `3`. A float engine that multiplied length × width × depth would pass the slab above **by
luck**. So a second, order-independent golden was worked out:

| Step | Working | Claude | You | Status |
|---|---|---|---|---|
| A 10 m × 10 m slab, 70 mm thick | 10000 × 10000 × 70 mm = 7,000,000,000 mm³ | **7 m³** exactly | | ⏳ |
| Cement, class A | 7 × 9 | **63 bags** exactly | | ⏳ |
| In floats, **every** order | `10*10*0.07*9`, `0.07*10*10*9`, `10*0.07*10*9` | all `63.00000000000001` → **64** | | ⏳ |

Every ordering overshoots, and the overshoot crosses a whole bag, so it costs a real bag instead of
disappearing at the purchase step. No lucky arrangement passes this row.

### B1-T2 · wall goldens

A wall 3.0 m × 2.7 m, 150 mm, mortar class A. Area 3000 × 2700 = 8,100,000 mm² = **8.1 m²**.

| Case | Working | Exact | Buy | Claude | You | Status |
|---|---|---|---|---|---|---|
| (a) plain | 8.1 × 12.5 | 101.25 | round up | **102 pcs** | | ⏳ |
| (b) one 0.9 × 2.1 m door | opening 1.89 m²; 8.1 − 1.89 = 6.21; × 12.5 | 77.625 | round up | **78 pcs** | | ⏳ |
| (c) no door, 5% wastage | 101.25 × 1.05 | 106.3125 | round up | **107 pcs** | | ⏳ |
| (c) the wrong order | round up *first*: 102, then × 1.05 = 107.1 | — | round up | **108 pcs** ✗ | | ⏳ |

(c) is the rule: **wastage before rounding, never after.** One block apart, and neither looks wrong.

### B1-T3 · thickness changes the mortar, never the block count

The same 8.1 m² wall, mortar class A, no wastage.

| Thickness | Blocks | Cement | Sand |
|---|---|---|---|
| 150 mm | 101.25 → **102 pcs** | 8.1 × 1.018 = 8.2458 → **9 bags** | 8.1 × 0.058 = 0.4698 → **0.5 m³** |
| 200 mm | 101.25 → **102 pcs** | 8.1 × 1.300 = 10.53 → **11 bags** | 8.1 × 0.074 = 0.5994 → **1.0 m³** |

Claude: as above. You: ⏳

The block count is identical; only the mortar moves. (The *material* changes — a 200 mm block is a
different product from a 150 mm one — but the count does not.)

**Openings bigger than the wall** give a named error, never a negative number. An opening exactly
equal to the wall is not an error: it is a wall that is all door, and it needs nothing.

### B1-T4 · concrete goldens

Six footings, 1.0 × 1.0 × 0.25 m. Volume 250,000,000 mm³ each × 6 = **1.5 m³**.

| Class | Cement exact | Buy | Sand | Gravel | Claude | You | Status |
|---|---|---|---|---|---|---|---|
| AA | 1.5 × 12 = 18 | **18 bags** | 0.75 → **1.0 m³** | 1.5 → **1.5 m³** | ✔ | | ⏳ |
| A | 1.5 × 9 = 13.5 | **14 bags** | 0.75 → **1.0 m³** | 1.5 → **1.5 m³** | ✔ | | ⏳ |
| B | 1.5 × 7.5 = 11.25 | **12 bags** | 0.75 → **1.0 m³** | 1.5 → **1.5 m³** | ✔ | | ⏳ |
| C | 1.5 × 6 = 9 | **9 bags** | 0.75 → **1.0 m³** | 1.5 → **1.5 m³** | ✔ | | ⏳ |

Sand at 0.75 m³ rounds up to 1.0 because the step is half a cubic metre — it is not 0.75 you can buy.

### B1-T5 · `toPurchaseLines` adds before it rounds

Two class B columns, 0.25 × 0.25 m, one 3.15 m tall and one 3.25 m tall.

| Step | Working | Claude | You | Status |
|---|---|---|---|---|
| Column 1 | 250 × 250 × 3150 mm | 0.196875 m³ | | ⏳ |
| Column 2 | 250 × 250 × 3250 mm | 0.203125 m³ | | ⏳ |
| Together | 0.196875 + 0.203125 | **exactly 0.4 m³** | | ⏳ |
| Cement, added first | 0.4 × 7.5 | exactly 3 → **3 bags** | | ⏳ |
| Cement, rounded first | 1.4765625 → 2, and 1.5234375 → 2 | **4 bags** ✗ | | ⏳ |

A whole bag of cement, bought for nothing, on a two-column job. On a real estimate this is where the
money leaks.

### B1-T7 · the largest allowed inputs

Block 0 caps a length at 1 km. Block 1 caps a count at 100. The largest thing Tantya will compute:

| Case | Working | Claude | You | Status |
|---|---|---|---|---|
| Wall 1 km × 1 km | 1,000,000 m² × 12.5 | **12,500,000 pcs** | | ⏳ |
| … its cement | 1,000,000 × 1.018 | **1,018,000 bags** | | ⏳ |
| … its sand | 1,000,000 × 0.058 | **58,000 m³** | | ⏳ |
| 100 blocks of 1 km³, class AA | 10¹¹ m³ × 12 | **1.2 × 10¹² bags** | | ⏳ |
| … in thousandths | 1.2 × 10¹⁵ | still exact — under 9.007 × 10¹⁵ | | ⏳ |

Absurd as a job, and exactly the point: the arithmetic has to stay exact at the boundary, or the
guard is where the silent wrong answer lives.
