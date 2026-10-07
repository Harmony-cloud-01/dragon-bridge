import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import { runInNewContext } from 'node:vm'
import ts from 'typescript'

function deferred() {
  let resolve, reject
  const promise = new Promise((res, rej) => { resolve = res; reject = rej })
  return { promise, resolve, reject }
}

function item(text) {
  return { key: `word:${text}`, text, type: 'word', box: 1 }
}

// Exercise the actual component handlers, including repeated clicks before a
// render, while storage writes and audio remain fully mocked.
function mount(initialItems = [item('first'), item('second'), item('third')]) {
  const slots = [], effects = [], cleanups = [], requests = [], plays = [], logs = []
  const listeners = new Map()
  let cursor = 0, mounted = true, updatesAfterUnmount = 0, dueItems = initialItems, needsRender = false
  const React = {
    useState(initial) {
      const index = cursor++
      if (!(index in slots)) slots[index] = initial
      return [slots[index], value => {
        if (!mounted) { updatesAfterUnmount++; return }
        slots[index] = typeof value === 'function' ? value(slots[index]) : value
        needsRender = true
      }]
    },
    useRef(initial) { const index = cursor++; return slots[index] ??= { current: initial } },
    useEffect(effect, deps) {
      const index = cursor++
      if (!(index in slots) || !deps || deps.some((dep, i) => dep !== slots[index][i])) {
        slots[index] = deps
        effects.push(() => { cleanups[index]?.(); cleanups[index] = effect() })
      }
    },
  }
  const window = {
    addEventListener(name, fn) { if (!listeners.has(name)) listeners.set(name, new Set()); listeners.get(name).add(fn) },
    removeEventListener(name, fn) { listeners.get(name)?.delete(fn) },
    dispatchEvent(event) { for (const fn of listeners.get(event.type) ?? []) fn(event) },
  }
  const mocks = {
    react: React,
    'react/jsx-runtime': { jsx: (type, props) => ({ type, props }), jsxs: (type, props) => ({ type, props }) },
    '@/hooks/use-srs': { useSrs: () => ({
      dueItems, allItems: dueItems,
      gradeItem: (key, grade) => {
        const request = { key, grade, ...deferred() }
        requests.push(request)
        return request.promise
      },
    }) },
    '@/hooks/use-dialect': { useDialect: () => ({
      playPronunciation: async text => { plays.push(text) }, isPlaying: false, currentlyPlaying: null,
    }) },
    './i18n-provider': { useI18n: () => ({ t: key => key }) },
    '@/utils/activity-log': { logEvent: event => logs.push(event) },
  }
  const exports = {}
  const js = ts.transpileModule(readFileSync(new URL('../components/review-srs.tsx', import.meta.url), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  }).outputText
  runInNewContext(js, { window, exports, require(name) {
    if (name in mocks) return mocks[name]
    return new Proxy({}, { get: (_, key) => key })
  } }, { filename: 'components/review-srs.tsx' })
  let tree
  function visit(node, fn) {
    if (!node || typeof node !== 'object') return
    if (Array.isArray(node)) { node.forEach(child => visit(child, fn)); return }
    fn(node)
    visit(node.props?.children, fn)
  }
  function text(node) {
    if (node == null) return ''
    if (Array.isArray(node)) return node.map(text).join('')
    if (typeof node !== 'object') return String(node)
    return text(node.props?.children)
  }
  function render() {
    do {
      needsRender = false
      cursor = 0
      tree = exports.ReviewSRS()
      while (effects.length) effects.shift()()
    } while (needsRender)
  }
  function button(label) {
    render()
    let found
    visit(tree, node => { if (node.type === 'Button' && text(node).trim() === label) found = node.props })
    assert.ok(found, `Missing ${label} button`)
    return found
  }
  render()
  return {
    requests, plays, logs, button,
    current: () => {
      render()
      let current
      visit(tree, node => { if (node.props?.className === 'text-4xl font-bold text-red-600') current = text(node) })
      return current
    },
    switchProfile: items => { dueItems = items; window.dispatchEvent({ type: 'profile:changed' }) },
    reload: items => { dueItems = items; render() },
    unmount: () => { mounted = false; cleanups.forEach(cleanup => cleanup?.()) },
    updatesAfterUnmount: () => updatesAfterUnmount,
    profileListeners: () => listeners.get('profile:changed')?.size ?? 0,
  }
}

test('ReviewSRS synchronously blocks repeated grades before a render and disables every grade button', async () => {
  const h = mount()
  const good = h.button('Good').onClick, easy = h.button('Easy').onClick
  const first = good(), duplicate = good(), otherGrade = easy()
  assert.equal(h.requests.length, 1)
  assert.equal(h.requests[0].key, 'word:first')
  assert.equal(h.requests[0].grade, 'good')
  for (const label of ['Again', 'Hard', 'Good', 'Easy']) assert.equal(h.button(label).disabled, true)
  h.requests[0].resolve(true)
  await Promise.all([first, duplicate, otherGrade])
  assert.equal(h.current(), 'second')
  assert.equal(h.button('Good').disabled, false)
  h.unmount()
})

test('ReviewSRS preserves the card and permits retry after a failed save', async () => {
  const h = mount(), first = h.button('Good').onClick()
  h.requests[0].resolve(false)
  await first
  assert.equal(h.current(), 'first')
  assert.equal(h.button('Good').disabled, false)
  const retry = h.button('Easy').onClick()
  assert.equal(h.requests.length, 2)
  assert.equal(h.requests[1].key, 'word:first')
  h.requests[1].resolve(true)
  await retry
  h.unmount()
})

test('ReviewSRS does not skip a due card when storage removes the committed card', async () => {
  const h = mount(), grade = h.button('Good').onClick, first = grade()
  h.requests[0].resolve(true)
  await first
  // A stale handler must not regrade the committed card before the reload.
  await grade()
  assert.equal(h.requests.length, 1)
  assert.equal(h.current(), 'second')
  h.reload([item('second'), item('third')])
  assert.equal(h.current(), 'second')
  const second = h.button('Good').onClick()
  h.requests[1].resolve(true)
  await second
  h.reload([item('third')])
  assert.equal(h.current(), 'third')
  const third = h.button('Good').onClick()
  h.requests[2].resolve(true)
  await third
  h.reload([])
  assert.equal(h.current(), undefined)
  assert.deepEqual(h.requests.map(request => request.key), ['word:first', 'word:second', 'word:third'])
  // Once the refreshed queue acknowledged removal, a later due date can return.
  h.reload([item('first')])
  assert.equal(h.current(), 'first')
  h.unmount()
})

test('ReviewSRS keeps multiple saved cards hidden during a delayed queue reload', async () => {
  const h = mount()
  for (let i = 0; i < 3; i++) {
    const grade = h.button('Good').onClick()
    h.requests[i].resolve(true)
    await grade
  }
  assert.equal(h.current(), undefined)
  assert.deepEqual(h.requests.map(request => request.key), ['word:first', 'word:second', 'word:third'])
  h.unmount()
})

test('ReviewSRS releases the grade guard if the grade operation unexpectedly rejects', async () => {
  const h = mount(), first = h.button('Good').onClick()
  h.requests[0].reject(new Error('storage unavailable'))
  await assert.rejects(first, /storage unavailable/)
  assert.equal(h.current(), 'first')
  assert.equal(h.button('Good').disabled, false)
  h.unmount()
})

test('ReviewSRS ignores a stale completion after switching profiles', async () => {
  const h = mount(), first = h.button('Good').onClick()
  h.requests[0].resolve(true)
  await first
  assert.equal(h.current(), 'second')
  const oldGrade = h.button('Good').onClick, pending = oldGrade()
  h.switchProfile([item('new first'), item('new second'), item('new third')])
  // A click delivered before the profile change renders must not use the old card.
  await oldGrade()
  assert.equal(h.requests.length, 2)
  assert.equal(h.current(), 'new first')
  assert.equal(h.button('Good').disabled, false)
  h.requests[1].resolve(true)
  await pending
  assert.equal(h.current(), 'new first')
  h.unmount()
})

test('ReviewSRS stale completion cannot unlock a new profile grade in flight', async () => {
  const h = mount(), old = h.button('Good').onClick()
  h.switchProfile([item('new first'), item('new second')])
  const current = h.button('Easy').onClick()
  assert.equal(h.requests.length, 2)
  assert.equal(h.requests[1].key, 'word:new first')
  h.requests[0].resolve(true)
  await old
  assert.equal(h.current(), 'new first')
  assert.equal(h.button('Good').disabled, true)
  await h.button('Good').onClick()
  assert.equal(h.requests.length, 2)
  h.requests[1].resolve(true)
  await current
  assert.equal(h.current(), 'new second')
  assert.equal(h.button('Good').disabled, false)
  h.unmount()
})

test('ReviewSRS does not update state or accept stale clicks after unmount', async () => {
  const h = mount(), click = h.button('Good').onClick, pending = click()
  h.unmount()
  assert.equal(h.profileListeners(), 0)
  h.requests[0].resolve(true)
  await pending
  await click()
  assert.equal(h.requests.length, 1)
  assert.equal(h.updatesAfterUnmount(), 0)
})

test('ReviewSRS delegates audio logging to the pronunciation provider', async () => {
  const h = mount()
  await h.button('Play').onClick()
  assert.deepEqual(h.plays, ['first'])
  assert.deepEqual(h.logs, [])
  h.unmount()
})
