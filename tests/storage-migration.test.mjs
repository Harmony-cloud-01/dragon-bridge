import test from 'node:test'
import assert from 'node:assert/strict'
import { load } from './load-module.mjs'

async function fixture({ failWrite = false } = {}) {
  const item = { key: 'word:你好', text: '你好', type: 'word', box: 1, due: 1, addedAt: 1, history: [] }
  const event = { type: 'audio.play', text: '你好', t: 1 }
  const data = new Map([['activity.logs::A', JSON.stringify([event])], ['srs.items::A', JSON.stringify({ [item.key]: item })]])
  const localStorage = { get length() { return data.size }, key: i => [...data.keys()][i], getItem: key => data.get(key) ?? null, setItem: () => { throw Error('Migration must preserve original bytes') } }
  const records = new Map(), events = new Map()
  let marker = null
  const engine = {
    settingsGet: async () => marker,
    settingsSet: async (key, value) => { marker = value },
    srsLoadAll: async id => records.get(id) ?? {},
    srsUpsert: async (value, id) => { records.set(id, { ...records.get(id), [value.key]: value }); if (failWrite) { failWrite = false; throw Error('interrupted') } },
    readEvents: async id => events.get(id) ?? [],
    logEvent: async (value, id) => { events.set(id, [...(events.get(id) ?? []), value]) },
  }
  const { migrateLocalProgress } = await load('storage/migrate-local.ts', {}, { localStorage, window: {} })
  return { run: () => migrateLocalProgress(engine), records, events, data, item, event }
}

test('legacy local progress is imported by profile without deleting original bytes', async () => {
  const h = await fixture(), original = [...h.data]
  await h.run()
  assert.equal(h.records.get('A')['word:你好'].text, '你好')
  assert.equal(h.events.get('A').length, 1)
  assert.deepEqual([...h.data], original)
})

test('migration retries are idempotent and preserve existing native SRS records', async () => {
  const h = await fixture()
  h.records.set('A', { [h.item.key]: { ...h.item, box: 4 } })
  await h.run(); await h.run()
  assert.equal(h.records.get('A')[h.item.key].box, 4)
  assert.equal(h.events.get('A').length, 1)
})

test('interrupted migration can retry without duplicated events or lost source', async () => {
  const h = await fixture({ failWrite: true })
  await assert.rejects(h.run(), /interrupted/)
  await h.run(); await h.run()
  assert.equal(h.records.get('A')[h.item.key].text, '你好')
  assert.equal(h.events.get('A').length, 1)
  assert.equal(h.data.size, 2)
})

test('malformed legacy progress blocks migration without hiding it as an empty store', async () => {
  const h = await fixture()
  h.data.set('activity.logs::A', '{broken')
  await assert.rejects(h.run())
  assert.equal(h.data.get('activity.logs::A'), '{broken')
})


test('completed import never resurrects later-deleted native progress', async () => {
  const h = await fixture()
  await h.run()
  h.records.set('A', {}); h.events.set('A', [])
  await h.run()
  assert.equal(Object.keys(h.records.get('A')).length, 0)
  assert.equal(h.events.get('A').length, 0)
  assert.equal(h.data.size, 2)
})


test('migration preserves repeated identical legacy events while remaining retry-safe', async () => {
  const h = await fixture()
  h.data.set('activity.logs::A', JSON.stringify([h.event, h.event]))
  await h.run(); await h.run()
  assert.equal(h.events.get('A').length, 2)
})
