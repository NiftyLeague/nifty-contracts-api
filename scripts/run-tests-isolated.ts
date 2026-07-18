#!/usr/bin/env bun
// Runs each test file in its own bun process to guarantee module-mock isolation.
// bun's shared module registry leaks `mock.module` calls across files in a single
// process, causing cascading failures. Per-file execution avoids that.
// Runs files in parallel batches for speed.
import { readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { spawn } from 'node:child_process'

function findTestFiles(dir: string, acc: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    const stat = statSync(full)
    if (stat.isDirectory()) {
      if (entry === 'node_modules' || entry === 'dist' || entry === '.git') continue
      findTestFiles(full, acc)
    } else if (entry.endsWith('.test.ts') || entry.endsWith('.test.tsx')) {
      acc.push(full)
    }
  }
  return acc
}

const files = findTestFiles(process.cwd()).sort()
const CONCURRENCY = 8
let totalFail = 0
const failedFiles: string[] = []

async function runFile(file: string): Promise<{ rel: string; fail: number }> {
  const rel = relative(process.cwd(), file)
  return new Promise((resolve) => {
    const child = spawn('bun', ['test', file], { stdio: 'pipe' })
    let out = ''
    child.stdout.on('data', (d) => (out += d))
    child.stderr.on('data', (d) => (out += d))
    child.on('close', () => {
      const m = out.match(/(\d+) fail/)
      const fail = m ? parseInt(m[1]) : 1
      resolve({ rel, fail })
    })
  })
}

for (let i = 0; i < files.length; i += CONCURRENCY) {
  const batch = files.slice(i, i + CONCURRENCY)
  const results = await Promise.all(batch.map(runFile))
  for (const r of results) {
    if (r.fail > 0) {
      totalFail += r.fail
      failedFiles.push(r.rel)
      console.log(`❌ ${r.rel} (${r.fail} failures)`)
    } else {
      console.log(`✅ ${r.rel}`)
    }
  }
}

if (totalFail > 0) {
  console.log(`\n${totalFail} total failures across ${failedFiles.length} files`)
  process.exit(1)
}
console.log(`\n✅ all ${files.length} test files passed`)
process.exit(0)
