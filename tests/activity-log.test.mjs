import test from 'node:test'
import assert from 'node:assert/strict'
import { load } from './load-module.mjs'

async function activity(engine, getProfile, notifications, failures) {
  return load('utils/activity-log.ts', {
    '@/storage': { getStorage: async () => engine, currentProfileId: getProfile },
    '@/utils/profile-storage': { scopedKey: key => key },
    '@/storage/failure': { reportStorageFailure: () => failures.push(true) },
  }, { window: { dispatchEvent: event => notifications.push(event.type) }, CustomEvent: class { constructor(type) { this.type = type } }, Event: class { constructor(type) { this.type = type } }, localStorage: { getItem: () => null, setItem: () => {} } })
}

test('activity reads the selected engine, including native data', async () => {
  const events = [{ type: 'srs.add', key: 'word:你好', t: 1 }]
  const mod = await activity({ readEvents: async id => { assert.equal(id, 'A'); return events } }, () => 'A', [], [])
  assert.deepEqual(await mod.readEvents(), events)
})

test('activity captures initiating profile before awaiting storage and signals only successful saves', async () => {
  let profile = 'A', written
  const events = [], failures = []
  const mod = await activity({ logEvent: async (ev, id) => { written = id } }, () => profile, events, failures)
  const done = mod.logEvent({ type: 'srs.add', key: 'x', t: 1 })
  profile = 'B'
  await done
  assert.equal(written, 'A')
  assert.deepEqual(events, ['activity:updated'])
})

test('failed activity writes show a failure, never a success event or fallback store', async () => {
  const events = [], failures = []
  const mod = await activity({ logEvent: async () => { throw Error('disk full') } }, () => 'A', events, failures)
  assert.equal(await mod.logEvent({ type: 'srs.add', key: 'x', t: 1 }), false)
  assert.deepEqual(events, [])
  assert.equal(failures.length, 1)
})
