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

*Filled in when Block 1 starts. Its examples need a reference book open, so they cannot be worked
before the book is chosen.*
