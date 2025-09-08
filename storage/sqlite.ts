"use client"

import type { StorageEngine } from "./engine"
import type { ActivityEvent } from "@/utils/activity-log"
import type { SrsItem } from "@/types/srs"
import type { Profile } from "@/utils/profile-storage"
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
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS srs_items (
        profile_id TEXT NOT NULL,
        key TEXT NOT NULL,
        text TEXT,
        type TEXT,
        box INTEGER,
        due INTEGER,
        addedAt INTEGER,
        history TEXT,
        PRIMARY KEY (profile_id, key)
      );
    `)
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS profiles (
        id TEXT PRIMARY KEY,
        name TEXT,
        avatar TEXT,
        createdAt INTEGER,
        lastActiveAt INTEGER,
        pinHash TEXT
      );
    `)
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS settings (
        profile_id TEXT NOT NULL,
        key TEXT NOT NULL,
        value TEXT,
        PRIMARY KEY (profile_id, key)
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
    async srsLoadAll(profileId?: string | null) {
      const conn = await ensureDb()
      const id = profileId ?? null
      const res = await conn.query(
        id ? `SELECT * FROM srs_items WHERE profile_id = ?;` : `SELECT * FROM srs_items;`,
        id ? [id] : []
      )
      const rows: any[] = res?.values || []
      const out: Record<string, SrsItem> = {}
      for (const r of rows) {
        try {
          out[r.key] = {
            key: r.key,
            text: r.text,
            type: r.type,
            box: Number(r.box) || 1,
            due: Number(r.due) || Date.now(),
            addedAt: Number(r.addedAt) || Date.now(),
            history: r.history ? JSON.parse(r.history) : [],
          }
        } catch {}
      }
      return out
    },
    async srsUpsert(item: SrsItem, profileId?: string | null) {
      const conn = await ensureDb()
      const id = profileId ?? null
      // naive upsert: try update, if no row updated then insert
      const history = JSON.stringify(item.history || [])
      const update = await conn.run(
        `UPDATE srs_items SET text=?, type=?, box=?, due=?, addedAt=?, history=? WHERE profile_id=? AND key=?;`,
        [item.text, item.type, item.box, item.due, item.addedAt, history, id, item.key]
      )
      const changes = update?.changes?.changes ?? update?.changes ?? 0
      if (!changes) {
        await conn.run(
          `INSERT INTO srs_items (profile_id, key, text, type, box, due, addedAt, history) VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
          [id, item.key, item.text, item.type, item.box, item.due, item.addedAt, history]
        )
      }
    },
    async srsRemove(srsKey: string, profileId?: string | null) {
      const conn = await ensureDb()
      const id = profileId ?? null
      await conn.run(`DELETE FROM srs_items WHERE profile_id = ? AND key = ?;`, [id, srsKey])
    },
    async profilesLoad() {
      const conn = await ensureDb()
      const res = await conn.query(`SELECT * FROM profiles ORDER BY createdAt ASC;`)
      const rows: any[] = res?.values || []
      return rows.map((r) => ({
        id: r.id,
        name: r.name,
        avatar: r.avatar,
        createdAt: Number(r.createdAt) || Date.now(),
        lastActiveAt: Number(r.lastActiveAt) || Date.now(),
        pinHash: r.pinHash ?? null,
      })) as Profile[]
    },
    async profilesSave(list: Profile[]) {
      const conn = await ensureDb()
      await conn.run(`DELETE FROM profiles;`)
      for (const p of list) {
        await conn.run(
          `INSERT INTO profiles (id, name, avatar, createdAt, lastActiveAt, pinHash) VALUES (?, ?, ?, ?, ?, ?);`,
          [p.id, p.name, p.avatar, p.createdAt, p.lastActiveAt, p.pinHash ?? null]
        )
      }
    },
    async profilesGetCurrent() {
      const conn = await ensureDb()
      const res = await conn.query(`SELECT value FROM settings WHERE profile_id = 'GLOBAL' AND key = 'current';`)
      const v = res?.values?.[0]?.value
      return v ?? null
    },
    async profilesSetCurrent(id: string) {
      const conn = await ensureDb()
      const update = await conn.run(`UPDATE settings SET value=? WHERE profile_id='GLOBAL' AND key='current';`, [id])
      const changes = update?.changes?.changes ?? update?.changes ?? 0
      if (!changes) {
        await conn.run(`INSERT INTO settings (profile_id, key, value) VALUES ('GLOBAL','current',?);`, [id])
      }
    },
  }
}
