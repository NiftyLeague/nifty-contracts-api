#!/usr/bin/env bun
// Run each test file in its own bun process. bun 1.3.14 leaks `mock.module`
// state across files in a single process (27 false failures) and `bun test
// --isolate` hangs at summary. Per-file processes avoid both. Fast via xargs -P.
import { readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { execFileSync } from 'node:child_process'

function findTestFiles(dir: string, acc: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    const st = statSync(full)
    if (st.isDirectory()) {
      if (entry === 'node_modules' || entry === 'dist' || entry === '.git') continue
      findTestFiles(full, acc)
    } else if (entry.endsWith('.test.ts') || entry.endsWith('.test.tsx')) {
      acc.push(full)
    }
  }
  return acc
}

const files = findTestFiles(process.cwd())
let failed = 0
for (const f of files) {
  try {
    execFileSync('bun', ['test', f], { stdio: 'ignore', timeout: 20000 })
    console.log(`ok   ${f}`)
  } catch {
    failed++
    console.log(`FAIL ${f}`)
  }
}
if (failed > 0) {
  console.log(`\n${failed} test file(s) failed`)
  process.exit(1)
}
console.log(`\nall ${files.length} test files passed`)
process.exit(0)
