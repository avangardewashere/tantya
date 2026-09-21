/**
 * A result that is either a value or a named error.
 *
 * Used wherever the wrong thing is something a person did — text that is not
 * a measurement, a door bigger than its wall — because a screen has to render
 * it as an inline message rather than crash.
 *
 * A bug upstream (a negative quantity, a purchase step of zero) still throws.
 * The two are different kinds of wrong and should not be handled the same way.
 */

export type Ok<T> = { readonly ok: true; readonly value: T }
export type Err<E> = { readonly ok: false; readonly error: E }
export type Result<T, E> = Ok<T> | Err<E>

export const ok = <T>(value: T): Ok<T> => ({ ok: true, value })
export const err = <E>(error: E): Err<E> => ({ ok: false, error })
