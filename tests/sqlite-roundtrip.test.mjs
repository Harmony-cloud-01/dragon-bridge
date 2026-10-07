import test from 'node:test'
import assert from 'node:assert/strict'
import { DatabaseSync } from 'node:sqlite'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { load } from './load-module.mjs'

// Exercise the actual schema/statements with SQLite. This adapter mimics the
// Capacitor call shapes; it is not a device/plugin integration test.
test('SQL schema and profile/SRS/activity/settings survive database close and reopen', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'dragon-sqlite-'))
  const path = join(dir, 'progress.db')
  const opened = []
  class SQLiteConnection {
    async createConnection() {
      const db = new DatabaseSync(path); opened.push(db)
      return {
        open: async () => {}, execute: async sql => db.exec(sql),
        run: async (sql, values = []) => ({ changes: { changes: Number(db.prepare(sql).run(...values).changes) } }),
        query: async (sql, values = []) => ({ values: db.prepare(sql).all(...values) }),
        executeSet: async (set, transaction) => {
          if (transaction) db.exec('BEGIN')
          try { for (const entry of set) db.prepare(entry.statement).run(...entry.values); if (transaction) db.exec('COMMIT') }
          catch (error) { if (transaction) db.exec('ROLLBACK'); throw error }
        },
      }
    }
  }
  const { makeSQLiteEngine } = await load('storage/sqlite.ts', {
    '@capacitor/core': { Capacitor: { isNativePlatform: () => true } },
    '@capacitor-community/sqlite': { CapacitorSQLite: {}, SQLiteConnection },
  })
  try {
    let engine = await makeSQLiteEngine(); await engine.init()
    const profile = { id: 'A', name: 'Learner', avatar: 'child', createdAt: 1, lastActiveAt: 2 }
    const item = { key: 'word:你好', text: '你好', type: 'word', box: 2, due: 3, addedAt: 1, history: [] }
    await engine.profilesSave([profile]); await engine.profilesSetCurrent('A')
    await engine.srsUpsert(item, 'A'); await engine.srsUpsert({ ...item, box: 3 }, 'A')
    await engine.srsUpsert(item, null)
    await engine.logEvent({ type: 'srs.add', key: item.key, t: 1 }, 'A')
    await engine.logEvent({ type: 'audio.play', text: '你好', t: 2 }, 'B')
    await engine.logEvent({ type: 'audio.play', text: '你好', t: 2 }, null)
    await engine.settingsSet('privacy.voiceConsent', 'false', 'A')
    opened.pop().close()
    engine = await makeSQLiteEngine(); await engine.init()
    assert.equal((await engine.profilesLoad())[0].name, 'Learner')
    assert.equal(await engine.profilesGetCurrent(), 'A')
    assert.equal((await engine.srsLoadAll('A'))[item.key].box, 3)
    assert.equal((await engine.srsLoadAll(null))[item.key].box, 2)
    assert.equal(await engine.settingsGet('privacy.voiceConsent', 'A'), 'false')
    await engine.clearEvents(null)
    assert.equal((await engine.readEvents(null)).length, 0)
    assert.equal((await engine.readEvents('A')).length, 1)
    assert.equal((await engine.readEvents('B')).length, 1)
    await assert.rejects(engine.profilesSave([profile, profile]))
    assert.equal((await engine.profilesLoad()).length, 1, 'failed replacement rolls back the deletion')
  } finally {
    for (const db of opened) db.close()
    await rm(dir, { recursive: true, force: true })
  }
})
