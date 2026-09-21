/**
 * Lint snippets of code against the project's real ESLint config.
 *
 * Used by B0-T3 to prove the wall around `src/engine` is switched on. It runs
 * in its own Node process because ESLint loads `eslint.config.mjs` with a
 * dynamic `import()`, which Jest's module registry refuses without
 * --experimental-vm-modules. Shelling out also means the test measures the
 * same ESLint that CI runs, not a reconstruction of it.
 *
 * stdin:  [{ "code": "...", "filePath": "/abs/path.ts" }, ...]
 * stdout: [{ "errorCount": 1, "messages": [{ "ruleId": "...", "message": "..." }] }, ...]
 */
import { ESLint } from 'eslint'

const input = await new Promise((resolve, reject) => {
  let text = ''
  process.stdin.setEncoding('utf8')
  process.stdin.on('data', (chunk) => (text += chunk))
  process.stdin.on('end', () => resolve(text))
  process.stdin.on('error', reject)
})

const probes = JSON.parse(input)
const eslint = new ESLint({ cwd: process.cwd() })

const results = []
for (const { code, filePath } of probes) {
  const [result] = await eslint.lintText(code, { filePath, warnIgnored: false })
  results.push({
    errorCount: result.errorCount,
    warningCount: result.warningCount,
    messages: result.messages.map((m) => ({ ruleId: m.ruleId, message: m.message })),
  })
}

process.stdout.write(JSON.stringify(results))
