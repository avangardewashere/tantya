/**
 * @jest-environment node
 *
 * B0-T2 · Every run is pinned to a timezone.
 *
 * `npm test` runs in Asia/Manila. `npm run test:utc` runs the same suite in
 * UTC, which is what GitHub's machines use — 8 hours behind. Between midnight
 * and 8 a.m. Manila time, "today" is a different date there, so date code
 * that is right in only one zone is wrong.
 *
 * There is no date code in Tantya until Block 3. This row is wired now so it
 * can never be forgotten later, and so the wiring itself is proven before
 * anything depends on it.
 */

describe('B0-T2 the run is pinned to a timezone', () => {
  const expected = process.env.TANTYA_TEST_TZ ?? 'Asia/Manila'

  it(`runs in ${expected}`, () => {
    expect(process.env.TZ).toBe(expected)
    expect(Intl.DateTimeFormat().resolvedOptions().timeZone).toBe(expected)
  })

  it('has the offset that timezone implies, in January and in July', () => {
    // The Philippines has never used daylight saving, so a Manila run is
    // UTC+8 all year and getTimezoneOffset is -480 minutes in both months.
    // UTC is 0 in both. Checking two months would catch a zone that shifts.
    const offsetInMinutes = expected === 'UTC' ? 0 : -480

    expect(new Date('2026-01-15T12:00:00Z').getTimezoneOffset()).toBe(offsetInMinutes)
    expect(new Date('2026-07-15T12:00:00Z').getTimezoneOffset()).toBe(offsetInMinutes)
  })

  it('reads the same instant as a different calendar date in the two zones', () => {
    // 00:30 on the 1st in Manila is still 16:30 on the last day of the
    // previous month in UTC. This is the exact trap Block 3's "valid until"
    // has to survive, so the difference is recorded now.
    const instant = new Date('2026-08-31T16:30:00Z')
    const dayOfMonth = instant.getDate()

    expect(dayOfMonth).toBe(expected === 'UTC' ? 31 : 1)
  })
})
