"use client"

import type { StorageEngine } from "./engine"
import type { ActivityEvent } from "@/utils/activity-log"
import { Capacitor } from "@capacitor/core"

async function loadSQLite() {
  try {
    const mod: any = await import('@capacitor-community/sqlite')
    return mod
  } catch (e) {
    return null
  }
}

export async function makeSQLiteEngine(): Promise<StorageEngine | null> {
  if (!Capacitor?.isNativePlatform) return null
  const sqliteMod: any = await loadSQLite()
  if (!sqliteMod) return null

  const sqlite = new sqliteMod.SQLiteConnection(Capacitor)
  let db: any = null

  async function ensureDb() {
    if (db) return db
    const conn = await sqlite.createConnection('dragon_bridge', false, 'no-encryption', 1)
    await conn.open()
    db = conn
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS activity_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        profile_id TEXT,
        type TEXT,
        payload TEXT,
        t INTEGER
      );
    `)
    return db
  }

  return {
    async init() {
      await ensureDb()
    },
    async logEvent(ev: ActivityEvent, profileId?: string | null) {
      const conn = await ensureDb()
      const payload = JSON.stringify(ev)
      await conn.run(
        `INSERT INTO activity_logs (profile_id, type, payload, t) VALUES (?, ?, ?, ?);`,
        [profileId ?? null, (ev as any).type ?? 'event', payload, (ev as any).t ?? Date.now()]
      )
    },
    async readEvents(profileId?: string | null) {
      const conn = await ensureDb()
      const res = await conn.query(
        profileId
          ? `SELECT payload FROM activity_logs WHERE profile_id = ? ORDER BY t ASC;`
          : `SELECT payload FROM activity_logs ORDER BY t ASC;`,
        profileId ? [profileId] : []
      )
      const rows: any[] = res?.values || []
      const events = rows
        .map((r): ActivityEvent | null => {
          try { return JSON.parse(r.payload) as ActivityEvent } catch { return null }
        })
        .filter((e): e is ActivityEvent => !!e)
      return events
    },
    async clearEvents(profileId?: string | null) {
      const conn = await ensureDb()
      if (profileId) await conn.run(`DELETE FROM activity_logs WHERE profile_id = ?;`, [profileId])
      else await conn.run(`DELETE FROM activity_logs;`)
    },
  }
}
