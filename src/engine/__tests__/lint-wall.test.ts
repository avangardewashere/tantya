/**
 * @jest-environment node
 *
 * B0-T3 · The wall around the maths.
 *
 * `src/engine` may not import React, Next, or anything from the screen
 * layers, so the maths can be tested without a pretend browser and reused on
 * the server in Block 9. An ESLint rule says so; this test proves the rule is
 * switched on, pointed at the right folder, and not so broad that it walls
 * off the rest of the app too.
 *
 * The probe files never exist on disk. ESLint takes the path only to decide
 * which config applies, so `npm run lint` never trips over a file that is
 * meant to be broken.
 */
import { execFile } from 'node:child_process'
import path from 'node:path'
import { promisify } from 'node:util'

const run = promisify(execFile)
const repoRoot = path.resolve(__dirname, '..', '..', '..')
const inEngine = path.join(repoRoot, 'src', 'engine', 'eslint-probe.ts')
const inUi = path.join(repoRoot, 'src', 'ui', 'eslint-probe.ts')

type Probe = { code: string; filePath: string }
type ProbeResult = {
  errorCount: number
  messages: { ruleId: string | null; message: string }[]
}

// One child process for every probe: ESLint has to read the Next.js config,
// which is far and away the slowest part.
jest.setTimeout(120_000)

const importing = (statement: string) => `${statement}\nexport const probe = 1\n`

const probes = {
  reactInEngine: { code: importing("import { useState } from 'react'"), filePath: inEngine },
  nextInEngine: { code: importing("import Link from 'next/link'"), filePath: inEngine },
  reactDomInEngine: {
    code: importing("import { createRoot } from 'react-dom/client'"),
    filePath: inEngine,
  },
  uiInEngine: {
    code: importing("import { AppShell } from '@/ui/app-shell'"),
    filePath: inEngine,
  },
  ownModuleInEngine: {
    code: importing("import { roundUpToStep } from './round'"),
    filePath: inEngine,
  },
  reactInUi: { code: importing("import { useState } from 'react'"), filePath: inUi },
} satisfies Record<string, Probe>

let results: Record<keyof typeof probes, ProbeResult>

beforeAll(async () => {
  const names = Object.keys(probes) as (keyof typeof probes)[]

  const child = run(process.execPath, [path.join(repoRoot, 'scripts', 'lint-probe.mjs')], {
    cwd: repoRoot,
    maxBuffer: 8 * 1024 * 1024,
  })
  child.child.stdin?.end(JSON.stringify(names.map((name) => probes[name])))

  const { stdout } = await child
  const parsed: ProbeResult[] = JSON.parse(stdout)

  results = Object.fromEntries(names.map((name, i) => [name, parsed[i]])) as typeof results
})

describe('B0-T3 src/engine may not import React or Next', () => {
  it('reports exactly one error for a React import inside src/engine', () => {
    const result = results.reactInEngine

    expect(result.errorCount).toBe(1)
    expect(result.messages[0].ruleId).toBe('no-restricted-imports')
    expect(result.messages[0].message).toMatch(/pure maths/i)
  })

  test.each([['nextInEngine'], ['reactDomInEngine'], ['uiInEngine']] as const)(
    'also stops %s',
    (name) => {
      const result = results[name]

      expect(result.errorCount).toBe(1)
      expect(result.messages[0].ruleId).toBe('no-restricted-imports')
    },
  )

  it('leaves the engine free to import its own modules', () => {
    expect(results.ownModuleInEngine.errorCount).toBe(0)
  })

  it('does not wall off the rest of the app', () => {
    // The same import that is an error in src/engine is ordinary in src/ui.
    // Without this row, a rule that banned React everywhere would still pass.
    expect(results.reactInUi.errorCount).toBe(0)
  })
})
