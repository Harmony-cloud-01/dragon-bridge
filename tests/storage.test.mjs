import test from 'node:test'
import assert from 'node:assert/strict'
import { load } from './load-module.mjs'

const scopedKey = (key, id) => id ? `${key}::${id}` : key
const profile = { getCurrentProfileId: () => 'learner', scopedKey }

test('browser never loads or constructs native SQLite', async () => {
  let loaded = 0
  const sqlite = await load('storage/sqlite.ts', {
    '@capacitor/core': { Capacitor: { isNativePlatform: () => false } },
    '@capacitor-community/sqlite': { SQLiteConnection: class { constructor() { loaded++ } } },
  })
  assert.equal(await sqlite.makeSQLiteEngine(), null)
  assert.equal(loaded, 0)
})

test('native SQLite uses plugin, awaits schema and retries failed initialization', async () => {
  let attempts = 0, closed = 0, expectedPlugin = {}, args
  let failSchema = true
  const conn = { open: async () => {}, execute: async () => { if (failSchema) throw Error('schema failed') }, close: async () => { closed++ } }
  const sqlite = await load('storage/sqlite.ts', {
    '@capacitor/core': { Capacitor: { isNativePlatform: () => true } },
    '@capacitor-community/sqlite': { CapacitorSQLite: expectedPlugin, SQLiteConnection: class {
      constructor(plugin) { assert.equal(plugin, expectedPlugin) }
      async createConnection(...a) { attempts++; args = a; return conn }
      async closeConnection() { closed++ }
    } },
  })
  const engine = await sqlite.makeSQLiteEngine()
  await assert.rejects(engine.init(), /schema failed/)
  failSchema = false
  await engine.init()
  assert.equal(attempts, 2)
  assert.equal(args[4], false)
  assert.ok(closed > 0)
})

test('failed native initialization is retriable and never silently switches to local storage', async () => {
  let attempts = 0, local = 0
  const eng = { init: async () => { if (++attempts === 1) throw Error('database unavailable') } }
  const storage = await load('storage/index.ts', {
    './migrate-local': { migrateLocalProgress: async () => {} },
    './local': { makeLocalEngine: () => { local++; return { init: async () => {} } } },
    './sqlite': { makeSQLiteEngine: async () => eng },
    '@/utils/profile-storage': profile,
  })
  await assert.rejects(storage.getStorage(), /database unavailable/)
  assert.equal(await storage.getStorage(), eng)
  assert.equal(local, 0)
})

test('native factory failures do not select a different data store', async () => {
  let attempts = 0, local = 0
  const eng = { init: async () => {} }
  const storage = await load('storage/index.ts', {
    './migrate-local': { migrateLocalProgress: async () => {} },
    './local': { makeLocalEngine: () => { local++; return eng } },
    './sqlite': { makeSQLiteEngine: async () => { if (++attempts === 1) throw Error('plugin unavailable'); return eng } },
    '@/utils/profile-storage': profile,
  })
  await assert.rejects(storage.getStorage(), /plugin unavailable/)
  assert.equal(await storage.getStorage(), eng)
  assert.equal(local, 0)
})

test('local persistence failures reject rather than report a successful save', async () => {
  const engine = (await load('storage/local.ts', { '@/utils/profile-storage': profile }, {
    window: {}, localStorage: { getItem: () => null, setItem: () => { throw Error('quota exceeded') }, removeItem: () => { throw Error('permission denied') } },
  })).makeLocalEngine()
  for (const op of [() => engine.logEvent({ type: 'srs.add', key: 'x', t: 1 }), () => engine.srsUpsert({ key: 'x' }), () => engine.srsRemove('x'), () => engine.profilesSave([]), () => engine.profilesSetCurrent('x'), () => engine.settingsSet('x', 'y'), () => engine.clearEvents()]) {
    await assert.rejects(op)
  }
})

test('web engine initializes once and shares concurrent requests', async () => {
  let initialized = 0
  const eng = { init: async () => { initialized++ } }
  const storage = await load('storage/index.ts', {
    './migrate-local': { migrateLocalProgress: async () => {} },
    './local': { makeLocalEngine: () => eng },
    './sqlite': { makeSQLiteEngine: async () => null },
    '@/utils/profile-storage': profile,
  })
  const [a, b] = await Promise.all([storage.getStorage(), storage.getStorage()])
  assert.equal(a, eng); assert.equal(b, eng); assert.equal(initialized, 1)
})

test('SQLite open failure closes its connection and a retry can reopen', async () => {
  let attempts = 0, closed = 0
  const sqlite = await load('storage/sqlite.ts', {
    '@capacitor/core': { Capacitor: { isNativePlatform: () => true } },
    '@capacitor-community/sqlite': { CapacitorSQLite: {}, SQLiteConnection: class {
      async createConnection() { return { open: async () => { if (++attempts === 1) throw Error('open failed') }, execute: async () => {} } }
      async closeConnection() { closed++ }
    } },
  })
  const eng = await sqlite.makeSQLiteEngine()
  await assert.rejects(eng.init(), /open failed/)
  await eng.init()
  assert.equal(attempts, 2); assert.equal(closed, 1)
})

test('SQLite anonymous reads/deletes stay scoped and profile replacement is transactional', async () => {
  const calls = []
  const conn = {
    open: async () => {}, execute: async () => {},
    query: async (sql, values) => { calls.push({ sql, values }); return { values: [] } },
    run: async (sql, values) => { calls.push({ sql, values }); return { changes: { changes: 1 } } },
    executeSet: async (set, transaction) => { calls.push({ set, transaction }) },
  }
  const sqlite = await load('storage/sqlite.ts', {
    '@capacitor/core': { Capacitor: { isNativePlatform: () => true } },
    '@capacitor-community/sqlite': { CapacitorSQLite: {}, SQLiteConnection: class { async createConnection() { return conn } } },
  })
  const eng = await sqlite.makeSQLiteEngine()
  await eng.init(); await eng.readEvents(null); await eng.clearEvents(null); await eng.srsLoadAll(null)
  for (const call of calls) assert.match(call.sql, /WHERE profile_id/)
  assert.equal(calls[0].values[0], null)
  assert.equal(calls[2].values[0], 'GLOBAL')
  await eng.profilesSave([{ id: 'A', name: 'A', avatar: 'child', createdAt: 1, lastActiveAt: 2 }])
  assert.equal(calls[3].transaction, true)
  assert.equal(calls[3].set.length, 2)
})

test('corrupt local SRS data rejects without overwriting the stored bytes', async () => {
  let wrote = false
  const engine = (await load('storage/local.ts', { '@/utils/profile-storage': profile }, {
    window: {}, localStorage: { getItem: () => '{corrupt', setItem: () => { wrote = true } },
  })).makeLocalEngine()
  await assert.rejects(engine.srsLoadAll('A'))
  await assert.rejects(engine.srsUpsert({ key: 'x' }, 'A'))
  assert.equal(wrote, false)
})


test('failed migration retries with the already initialized native connection', async () => {
  let factories = 0, inits = 0, migrations = 0
  const eng = { init: async () => { inits++ } }
  const storage = await load('storage/index.ts', {
    './migrate-local': { migrateLocalProgress: async () => { if (++migrations === 1) throw Error('migration interrupted') } },
    './local': { makeLocalEngine: () => { throw Error('must not switch stores') } },
    './sqlite': { makeSQLiteEngine: async () => { factories++; return eng } },
    '@/utils/profile-storage': profile,
  })
  await assert.rejects(storage.getStorage(), /migration interrupted/)
  assert.equal(await storage.getStorage(), eng)
  assert.equal(factories, 1); assert.equal(inits, 1); assert.equal(migrations, 2)
})
