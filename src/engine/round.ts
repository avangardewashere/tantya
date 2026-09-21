/**
 * Rounding up to what a store actually sells.
 *
 * Both arguments are in the SAME whole unit, normally thousandths: a need of
 * 2.26 m3 is 2260, a half-cubic-metre step is 500, and the answer is 2500.
 *
 * It is done with a remainder, not with division, because the obvious float
 * version is wrong. `Math.ceil(0.7 / 0.1) * 0.1` is 0.7000000000000001, and
 * B0-T5 keeps that counter-example on the record.
 */
export function roundUpToStep(quantity: number, step: number): number {
  if (!Number.isSafeInteger(quantity)) {
    throw new RangeError(
      `roundUpToStep works on whole numbers only, got a quantity of ${quantity}. ` +
        `Convert to thousandths of a unit first.`,
    )
  }
  if (!Number.isSafeInteger(step)) {
    throw new RangeError(
      `roundUpToStep works on whole numbers only, got a step of ${step}. ` +
        `Convert to thousandths of a unit first.`,
    )
  }
  if (quantity < 0) {
    throw new RangeError(
      `roundUpToStep will not round a negative quantity (${quantity}). ` +
        `A material need is never negative; this is a bug upstream.`,
    )
  }
  if (step <= 0) {
    throw new RangeError(
      `A purchase step must be more than zero, got ${step}. ` +
        `A step of 0 would mean the store sells nothing.`,
    )
  }

  const remainder = quantity % step
  const rounded = remainder === 0 ? quantity : quantity + (step - remainder)

  if (!Number.isSafeInteger(rounded)) {
    throw new RangeError(
      `That order is too large to count exactly: ${quantity} rounded up to a step of ${step}.`,
    )
  }
  return rounded
}
