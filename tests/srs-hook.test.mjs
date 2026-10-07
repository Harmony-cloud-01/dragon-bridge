import test from 'node:test'
import assert from 'node:assert/strict'
import { load } from './load-module.mjs'
const tick = () => new Promise(resolve => setImmediate(resolve))
function deferred() { let resolve; const promise = new Promise(r => { resolve = r }); return { promise, resolve } }

async function mount(engine) {
  const state = [], effects = [], failures = [], activity = [], listeners = new Map()
  let profile = 'A', cursor = 0
  const React = {
    useState(initial) { const i = cursor++; if (!(i in state)) state[i] = initial; return [state[i], next => { state[i] = typeof next === 'function' ? next(state[i]) : next }] },
    useEffect(effect) { const i = cursor++; if (!(i in state)) { state[i] = true; effects.push(effect) } },
    useCallback(fn) { cursor++; return fn }, useMemo(fn) { cursor++; return fn() },
  }
  const window = {
    addEventListener(name, fn) { listeners.set(name, fn) }, removeEventListener(name) { listeners.delete(name) },
    dispatchEvent(event) { listeners.get(event.type)?.(event) },
  }
  const { queueSrsMutation } = await load('storage/srs-mutations.ts')
  const { useSrs } = await load('hooks/use-srs.ts', {
    react: React,
    '@/utils/activity-log': { logEvent: (event, id) => activity.push({ event, id }) },
    '@/storage': { getStorage: async () => engine, currentProfileId: () => profile },
    '@/storage/srs-mutations': { queueSrsMutation },
    '@/storage/failure': { reportStorageFailure: () => failures.push(true) },
  }, { window, CustomEvent: class { constructor(type, opts) { this.type = type; this.detail = opts.detail } } })
  function render() { cursor = 0; return useSrs() }
  const api = render(), cleanups = effects.map(fn => fn())
  await tick()
  return { api, render, failures, activity, profile(id) { profile = id; window.dispatchEvent({ type: 'profile:changed' }) }, unmount() { cleanups.forEach(fn => fn?.()) } }
}

test('SRS save failure does not optimistically add an unsaved item or emit success activity', async () => {
  const h = await mount({ srsLoadAll: async () => ({}), srsUpsert: async () => { throw Error('quota') } })
  assert.equal(await h.api.addItem('你好'), false)
  assert.equal(h.render().allItems.length, 0)
  assert.equal(h.activity.length, 0); assert.equal(h.failures.length, 1)
})

test('SRS captures the initiating profile, commits before rendering, and refreshes hooks', async () => {
  const store = { A: {}, B: {} }, gate = deferred()
  let savedProfile
  const h = await mount({ srsLoadAll: async id => ({ ...store[id] }), srsUpsert: async (item, id) => { await gate.promise; savedProfile = id; store[id][item.key] = item } })
  const done = h.api.addItem('你好')
  assert.equal(h.render().allItems.length, 0)
  h.profile('B'); gate.resolve()
  assert.equal(await done, true)
  await tick()
  assert.equal(savedProfile, 'A'); assert.equal(h.activity[0].id, 'A')
  assert.equal(h.render().allItems.length, 0)
  h.profile('A'); await tick()
  assert.equal(h.render().allItems.length, 1)
})

test('a late hydration response cannot replace the newly selected profile', async () => {
  const gate = deferred(), item = { key: 'x', text: 'x', type: 'word', box: 1, due: 1, addedAt: 1, history: [] }
  const h = await mount({ srsLoadAll: async id => id === 'A' ? gate.promise : {} })
  h.profile('B'); await tick(); gate.resolve({ x: item }); await tick()
  assert.equal(h.render().allItems.length, 0)
  h.unmount()
})
