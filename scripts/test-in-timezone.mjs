/**
 * Run the Jest suite in a named timezone.
 *
 *   node scripts/test-in-timezone.mjs UTC -- --coverage
 *
 * jest.config.ts reads TANTYA_TEST_TZ and pins process.env.TZ to it before
 * Jest starts, so the whole run — main process and workers — agrees on what
 * "today" is. Setting TZ from inside a test file is too late to be trusted.
 */
import { spawn } from 'node:child_process'

const [timezone, ...rest] = process.argv.slice(2)

if (!timezone) {
  console.error('Usage: node scripts/test-in-timezone.mjs <timezone> [jest args]')
  process.exit(2)
}

// Fail loudly on a typo rather than silently falling back to the system zone.
try {
  new Intl.DateTimeFormat('en-US', { timeZone: timezone })
} catch {
  console.error(`Unknown timezone: ${timezone}`)
  process.exit(2)
}

const jestArgs = rest[0] === '--' ? rest.slice(1) : rest

const child = spawn(
  process.execPath,
  ['node_modules/jest/bin/jest.js', ...jestArgs],
  {
    stdio: 'inherit',
    env: { ...process.env, TANTYA_TEST_TZ: timezone, TZ: timezone },
  },
)

child.on('exit', (code, signal) => {
  if (signal) process.kill(process.pid, signal)
  else process.exit(code ?? 1)
})
