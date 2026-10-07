import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const workflow = readFileSync(new URL('../.github/workflows/gh-pages.yml', import.meta.url), 'utf8')
const guard = "github.event_name == 'push' && github.ref == 'refs/heads/main'"

test('Pages setup and artifact upload are restricted to main pushes', () => {
  for (const action of ['actions/configure-pages@v5', 'actions/upload-pages-artifact@v3']) {
    const lines = workflow.split('\n')
    const index = lines.findIndex(line => line.trim() === `uses: ${action}`)
    assert.ok(index > 0)
    assert.equal(lines[index - 1].trim(), `if: ${guard}`)
  }
})

test('Pages deployment job has the main-push guard without changing permissions', () => {
  const deploy = workflow.match(/^  deploy:\n((?:.*\n)*)/m)?.[1]
  assert.ok(deploy)
  assert.equal(deploy.split('\n')[0].trim(), `if: ${guard}`)
  assert.match(workflow, /permissions:\n  contents: read\n  pages: write\n  id-token: write/)
})

test('review pull requests and non-main pushes cannot satisfy the Pages guard', () => {
  // Assert the exact checked expression above before evaluating its event matrix.
  const allowed = new Function('github', `return ${guard}`)
  assert.equal(allowed({ event_name: 'pull_request', ref: 'refs/pull/16/merge' }), false)
  assert.equal(allowed({ event_name: 'pull_request', ref: 'refs/heads/main' }), false)
  assert.equal(allowed({ event_name: 'push', ref: 'refs/heads/fix/offline-reliability-first-pass' }), false)
  assert.equal(allowed({ event_name: 'push', ref: 'refs/tags/v2.0.0' }), false)
  assert.equal(allowed({ event_name: 'push', ref: 'refs/heads/main' }), true)
})

test('pull requests retain their unguarded web build', () => {
  assert.match(workflow, /pull_request:\n    branches: \[main\]/)
  assert.match(workflow, /  build:\n    runs-on: ubuntu-latest/)
  assert.match(workflow, /- name: Build static export \(Next.js output export\)\n        run: pnpm run build/)
})
