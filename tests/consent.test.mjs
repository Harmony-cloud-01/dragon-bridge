import assert from 'node:assert/strict'
import test from 'node:test'
import { load } from './load-module.mjs'

function deferred() {
  let resolve
  const promise = new Promise(res => { resolve = res })
  return { promise, resolve }
}
const flush = () => new Promise(resolve => setImmediate(resolve))

async function setup({ cached = 'true', blockStorage = false, deferEngine = false } = {}) {
  let profile = 'alice'
  const reads = [], writes = [], events = [], values = new Map([['privacy.voiceConsent::alice', cached]])
  const engine = {
    settingsGet: async (key, id) => { const request = deferred(); reads.push({ key, id, ...request }); return request.promise },
    settingsSet: async (key, value, id) => { writes.push({ key, value, id }) },
  }
  const engineReady = deferred()
  if (!deferEngine) engineReady.resolve(engine)
  const consent = await load('stores/consent.ts', {
    '@/utils/profile-storage': { scopedKey: (base, id = profile) => id ? `${base}::${id}` : base },
    '@/storage': { currentProfileId: () => profile, getStorage: () => engineReady.promise },
    '@/storage/failure': { reportStorageFailure() {} },
  }, {
    window: { dispatchEvent: event => { events.push({ type: event.type, detail: event.detail }) } },
    localStorage: {
      getItem: key => values.get(key) ?? null,
      setItem: (key, value) => { if (blockStorage) throw Error('blocked'); values.set(key, value) },
    },
    CustomEvent: class { constructor(type, options) { this.type = type; this.detail = options.detail } },
  })
  return { ...consent, reads, writes, events, values, setProfile: id => { profile = id }, ready: () => engineReady.resolve(engine) }
}

test('consent refresh retains its originating profile across storage initialization', async () => {
  const h = await setup({ deferEngine: true })
  assert.equal(h.getConsent(), true)
  h.setProfile('bob')
  h.ready()
  await flush()
  assert.equal(h.reads[0].id, 'alice')
  h.reads[0].resolve('false')
  await flush()
  assert.equal(h.values.get('privacy.voiceConsent::alice'), 'false')
  assert.equal(h.values.has('privacy.voiceConsent::bob'), false)
  assert.equal(h.events.length, 0, 'background refresh must not change the active profile consent')
})

test('a stale refresh cannot undo an explicit consent revocation', async () => {
  const h = await setup()
  h.getConsent()
  await flush()
  h.setConsent(false)
  h.reads[0].resolve('true')
  await flush()
  assert.equal(h.values.get('privacy.voiceConsent::alice'), 'false')
  assert.deepEqual(h.events, [{ type: 'consent:changed', detail: false }])
})

test('consent writes retain the profile that authorized the change', async () => {
  const h = await setup({ deferEngine: true })
  h.setConsent(false)
  h.setProfile('bob')
  h.ready()
  await flush()
  assert.deepEqual(h.writes, [{ key: 'privacy.voiceConsent', value: 'false', id: 'alice' }])
})

test('revocation notifies live microphone owners even when the cache write fails', async () => {
  const h = await setup({ blockStorage: true })
  h.setConsent(false)
  await flush()
  assert.deepEqual(h.events, [{ type: 'consent:changed', detail: false }])
})

test('a refresh that revokes current-profile consent notifies the microphone owner', async () => {
  const h = await setup()
  h.getConsent()
  await flush()
  h.reads[0].resolve('false')
  await flush()
  assert.deepEqual(h.events, [{ type: 'consent:changed', detail: false }])
})

test('a failed cache write does not let later reads resurrect revoked consent', async () => {
  const h = await setup({ blockStorage: true })
  h.setConsent(false)
  assert.equal(h.getConsent(), false)
  await flush()
  assert.equal(h.getConsent(), false)
})
