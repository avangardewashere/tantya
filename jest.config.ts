import type { Config } from 'jest'
import nextJest from 'next/jest.js'

/**
 * Every run is pinned to a timezone before Jest starts.
 *
 * `npm test` runs in Asia/Manila, the only timezone Tantya's users are in.
 * `npm run test:utc` sets TANTYA_TEST_TZ=UTC to run the same suite the way
 * GitHub's machines do, 8 hours behind Manila. Between midnight and 8 a.m.
 * Manila time "today" is a different date there, so date code that is right
 * in only one zone is wrong.
 *
 * This has to happen here, in the config, not inside a test file: Node reads
 * TZ when it first formats a date, and Jest's workers inherit the environment
 * of the process that reads this file.
 */
process.env.TZ = process.env.TANTYA_TEST_TZ ?? 'Asia/Manila'

const createJestConfig = nextJest({ dir: './' })

const config: Config = {
  coverageProvider: 'v8',

  // Screens run in jsdom. Pure files opt out with a `@jest-environment node`
  // docblock: node is faster and has TextEncoder, structuredClone and
  // crypto.subtle, which jsdom lacks.
  testEnvironment: 'jsdom',

  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],

  testPathIgnorePatterns: ['<rootDir>/.next/', '<rootDir>/node_modules/'],

  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/app/layout.tsx',
  ],
}

// Exported this way so next/jest can load the (async) Next.js config.
export default createJestConfig(config)
