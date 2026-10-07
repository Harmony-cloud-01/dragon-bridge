import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { runInNewContext } from 'node:vm'
import ts from 'typescript'
import { load } from './load-module.mjs'

const clone = value => JSON.parse(JSON.stringify(value))
const tick = () => new Promise(resolve => setImmediate(resolve))
const deferred = () => { let resolve; const promise = new Promise(done => { resolve = done }); return { resolve, promise } }
const item = (key = 'word:你好') => ({ key, text: '你好', type: 'word', box: 2, due: 2000, addedAt: 1000, history: [{ t: 1500, grade: 'good' }] })
const event = { type: 'srs.add', key: 'word:你好', t: 1000 }
const backup = data => ({ version: 2, profile: { id: 'source', name: 'Source', avatar: 'child' }, exportedAt: '2026-10-07T00:00:00.000Z', data })

async function setup({ preferences = {}, overrides = {}, gate, preferenceFailure = false } = {}) {
  const writes = [], reads = [], notifications = [], listeners = new Map(), local = new Map(Object.entries(preferences))
  const srs = { A: { old: item('old') }, B: { other: item('other') }, GLOBAL: {} }
  const activity = { A: [{ type: 'audio.play', text: 'old', t: 500 }], B: [event], GLOBAL: [] }
  let storageCalls = 0
  const scope = id => id ?? 'GLOBAL'
  const engine = {
    async srsLoadAll(id) { reads.push(['srs', id]); return clone(srs[scope(id)]) },
    async srsUpsert(value, id) { writes.push(['upsert', id]); srs[scope(id)][value.key] = clone(value) },
    async srsRemove(key, id) { writes.push(['remove', id]); delete srs[scope(id)][key] },
    async readEvents(id) { reads.push(['activity', id]); return clone(activity[scope(id)]) },
    async clearEvents(id) { writes.push(['clear', id]); activity[scope(id)] = [] },
    async logEvent(value, id) { writes.push(['log', id]); activity[scope(id)].push(clone(value)) },
    ...overrides,
  }
  const window = {
    addEventListener(name, fn) { if (!listeners.has(name)) listeners.set(name, new Set()); listeners.get(name).add(fn) },
    removeEventListener(name, fn) { listeners.get(name)?.delete(fn) },
    dispatchEvent(value) { notifications.push(value); for (const fn of listeners.get(value.type) ?? []) fn(value) },
  }
  const Event = class { constructor(type, options) { this.type = type; this.detail = options?.detail } }
  const localStorage = {
    getItem: key => local.get(key) ?? null,
    setItem(key, value) { if (preferenceFailure) throw Error('QuotaExceededError'); writes.push(['local', key]); local.set(key, value) },
    removeItem(key) { if (preferenceFailure) throw Error('QuotaExceededError'); writes.push(['local-remove', key]); local.delete(key) },
  }
  const { queueSrsMutation } = await load('storage/srs-mutations.ts')
  const api = await load('utils/profile-backup.ts', {
    '@/storage': { getStorage: async () => { storageCalls++; if (gate) await gate.promise; return engine } },
    '@/storage/srs-mutations': { queueSrsMutation },
    '@/utils/profile-storage': { scopedKey: (key, id) => id ? `${key}::${id}` : key },
  }, { window, Event, CustomEvent: Event, localStorage, Error })
  return { api, engine, window, localStorage, Event, local, writes, reads, srs, activity, notifications, queueSrsMutation, storageCalls: () => storageCalls }
}

const profile = { id: 'A', name: 'Alice', avatar: 'child' }

test('profile export reads selected engine progress, keeps v2 schema, and preserves raw local strings', async () => {
  const h = await setup({ preferences: {
    'srs.items::A': '{}', 'activity.logs::A': '[]',
    'dialect.v2.selectedDialects::A': '["zh-CN"]', 'dialect.v2.playbackRate::A': '0.8',
    'dialect.v2.preferredVoice::A': 'My voice', 'ui.lang::A': 'en',
    'daily.reminder.config::A': '{"hour":19,"minute":0,"days":[1,2],"enabled":false}',
  } })
  const result = clone(await h.api.exportProfileBackup(profile))
  assert.equal(result.version, 2)
  assert.deepEqual(result.profile, profile)
  assert.deepEqual(result.data.srs, h.srs.A)
  assert.deepEqual(result.data.activity, h.activity.A)
  assert.deepEqual(result.data.dialect, { selectedDialects: ['zh-CN'], playbackRate: 0.8, preferredVoice: 'My voice' })
  assert.equal(result.data.uiLang, 'en')
  assert.deepEqual(h.reads, [['srs', 'A'], ['activity', 'A']])
  assert.equal(h.writes.length, 0)
})

test('profile export captures identity before awaiting native initialization', async () => {
  const gate = deferred(), h = await setup({ gate }), selected = { ...profile }
  const pending = h.api.exportProfileBackup(selected)
  selected.id = 'B'; selected.name = 'Bob'
  gate.resolve()
  const result = await pending
  assert.equal(result.profile.id, 'A'); assert.equal(result.profile.name, 'Alice')
  assert.ok(h.reads.every(([, id]) => id === 'A'))
})

test('v2 profile import replaces selected engine progress and writes only local preferences', async () => {
  const h = await setup({ preferences: { 'srs.items::A': 'legacy source remains', 'activity.logs::A': 'legacy source remains' } })
  await h.api.importProfileBackup(backup({
    srs: { [item().key]: item() }, activity: [event],
    reminders: { hour: 8, minute: 30, days: [], enabled: false },
    dialect: { selectedDialects: ['zh-TW'], playbackRate: 1.1, preferredVoice: 'Voice' }, uiLang: 'zh',
  }), 'A')
  assert.deepEqual(h.srs.A, { [item().key]: item() }); assert.deepEqual(h.activity.A, [event])
  assert.deepEqual(h.srs.B, { other: item('other') }); assert.deepEqual(h.activity.B, [event])
  assert.equal(h.local.get('dialect.v2.selectedDialects::A'), '["zh-TW"]')
  assert.equal(h.local.get('dialect.v2.playbackRate::A'), '1.1')
  assert.equal(h.local.get('dialect.v2.preferredVoice::A'), 'Voice')
  assert.equal(h.local.get('ui.lang::A'), 'zh')
  assert.equal(h.local.get('srs.items::A'), 'legacy source remains')
  assert.equal(h.local.get('activity.logs::A'), 'legacy source remains')
  assert.deepEqual(h.notifications.map(value => value.type), ['srs:updated', 'activity:updated', 'profile:changed'])
  assert.equal(h.notifications[0].detail.profileId, 'A')
})

test('all imported fields validate before storage initialization or destructive writes', async () => {
  const invalid = [
    {}, { version: 3, data: { srs: {} } }, backup({}), backup({ srs: [] }),
    backup({ srs: { mismatch: item() } }), backup({ srs: { old: { ...item('old'), box: 8 } } }),
    backup({ srs: { old: { ...item('old'), history: [{ t: 0, grade: 'bad' }] } } }),
    backup({ srs: {}, activity: [{ ...event, t: 'yesterday' }] }),
    backup({ srs: {}, activity: [{ type: 'unknown', t: 1 }] }),
    backup({ srs: {}, reminders: { hour: 99, minute: 0, days: [], enabled: true } }),
    backup({ srs: {}, dialect: { selectedDialects: [1] } }),
    backup({ srs: {}, dialect: { playbackRate: 0 } }),
    backup({ srs: {}, uiLang: { unexpected: 'object' } }),
    JSON.parse('{"version":2,"data":{"srs":{"__proto__":{"key":"__proto__","text":"x","type":"word","box":1,"due":1,"addedAt":1,"history":[]}}}}'),
  ]
  for (const value of invalid) {
    const h = await setup()
    await assert.rejects(h.api.importProfileBackup(value, 'A'), /Invalid profile backup/)
    assert.equal(h.storageCalls(), 0); assert.equal(h.writes.length, 0)
    assert.equal(h.notifications.length, 0)
    assert.deepEqual(h.srs.A, { old: item('old') })
  }
})

test('v2 null progress is absent data while empty collections explicitly clear the chosen scope', async () => {
  const h = await setup({ preferences: { 'dialect.v2.preferredVoice::A': 'Old voice' } })
  await h.api.importProfileBackup(backup({ srs: null, activity: null, reminders: null, dialect: { selectedDialects: null, playbackRate: null, preferredVoice: null }, uiLang: null }), 'A')
  assert.deepEqual(h.srs.A, { old: item('old') }); assert.equal(h.activity.A.length, 1)
  assert.equal(h.local.has('dialect.v2.preferredVoice::A'), false)
  await h.api.importProfileBackup(backup({ srs: {}, activity: [] }), 'A')
  assert.deepEqual(h.srs.A, {}); assert.deepEqual(h.activity.A, [])
  assert.equal(h.activity.B.length, 1)
  await h.api.importProfileBackup(backup({ srs: { [item().key]: item() }, activity: [event] }), null)
  assert.deepEqual(h.srs.GLOBAL, { [item().key]: item() }); assert.deepEqual(h.activity.GLOBAL, [event])
})

test('JSON-encoded local strings retain the original v2 backup field names', async () => {
  const h = await setup({ preferences: { 'dialect.v2.selectedDialects::A': '["zh-CN"]', 'dialect.v2.preferredVoice::A': '"Old voice"', 'ui.lang::A': '"en"' } })
  const result = await h.api.exportProfileBackup(profile)
  assert.equal(result.data.dialect.preferredVoice, 'Old voice')
  assert.equal(result.data.uiLang, 'en')
  assert.deepEqual(clone(result.data.dialect.selectedDialects), ['zh-CN'])
})

test('failed progress and preference writes reject and refresh partially changed views', async () => {
  const h = await setup({ overrides: { async clearEvents() { throw Error('disk full') } } })
  await assert.rejects(h.api.importProfileBackup(backup({ srs: {}, activity: [] }), 'A'), /Some profile data may have changed/)
  assert.deepEqual(h.srs.A, {})
  assert.deepEqual(h.notifications.map(value => value.type), ['srs:updated', 'activity:updated', 'profile:changed'])
  const blocked = await setup({ preferenceFailure: true })
  await assert.rejects(blocked.api.importProfileBackup(backup({ uiLang: 'en' }), 'A'), /Some profile data may have changed/)
  assert.equal(blocked.local.size, 0)
})

test('failed prerequisite reads and malformed stored preferences never produce a backup or start writes', async () => {
  const h = await setup({ overrides: { async srsLoadAll() { throw Error('database unavailable') } } })
  await assert.rejects(h.api.exportProfileBackup(profile), /database unavailable/)
  await assert.rejects(h.api.importProfileBackup(backup({ srs: {}, activity: [] }), 'A'), /database unavailable/)
  assert.equal(h.writes.length, 0); assert.equal(h.notifications.length, 0)
  const corrupt = await setup({ preferences: { 'daily.reminder.config::A': '{broken' } })
  await assert.rejects(corrupt.api.exportProfileBackup(profile))
})

test('profile restore shares the SRS mutation queue with normal grading and adding', async () => {
  const gate = deferred(), order = [], h = await setup({ overrides: { async srsUpsert() { order.push('import'); await gate.promise } } })
  const restore = h.api.importProfileBackup(backup({ srs: { old: item('old') } }), 'A')
  const grade = h.queueSrsMutation(async () => { order.push('grade') })
  await tick(); assert.deepEqual(order, ['import'])
  gate.resolve(); await Promise.all([restore, grade])
  assert.deepEqual(order, ['import', 'grade'])
})

// Mount the real TeacherMode and real backup helper. UI controls, file reads,
// downloads and storage are mocked; no device or external write is accessed.
function mountTeacher(h) {
  const hooks = [], effects = [], alerts = [], downloads = []
  let cursor = 0, current = { ...profile }, tree
  const react = {
    useState(initial) { const i = cursor++; if (!(i in hooks)) hooks[i] = initial; return [hooks[i], value => { hooks[i] = typeof value === 'function' ? value(hooks[i]) : value }] },
    useRef(initial) { const i = cursor++; return hooks[i] ??= { current: initial } },
    useEffect(fn) { const i = cursor++; if (!(i in hooks)) { hooks[i] = true; effects.push(fn) } },
  }
  const mocks = {
    react,
    'react/jsx-runtime': { jsx: (type, props) => ({ type, props }), jsxs: (type, props) => ({ type, props }) },
    '@/hooks/use-srs': { useSrs: () => ({ allItems: [], dueItems: [] }) },
    '@/storage/failure': { reportStorageFailure() {} },
    '@/utils/activity-log': { readEvents: async () => [], clearEvents() {} },
    './profile-provider': { useProfile: () => ({ current }) },
    '@/utils/profile-backup': h.api,
  }
  const exports = {}
  const js = ts.transpileModule(readFileSync(new URL('../components/teacher-mode.tsx', import.meta.url), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  }).outputText
  runInNewContext(js, {
    exports, console, window: h.window, Event: h.Event, CustomEvent: h.Event,
    // Pass host Error for instanceof checks on helper rejections from its VM.
    Error,
    alert: value => alerts.push(value),
    Blob: class { constructor(parts) { this.content = parts.join('') } },
    URL: { createObjectURL: blob => blob, revokeObjectURL() {} },
    document: { body: { appendChild() {} }, createElement: () => ({ click() { downloads.push({ name: this.download, data: JSON.parse(this.href.content) }) }, remove() {} }) },
    require(name) { if (name in mocks) return mocks[name]; return new Proxy({}, { get: (_, key) => key }) },
  }, { filename: 'components/teacher-mode.tsx' })
  const visit = (node, fn) => {
    if (!node || typeof node !== 'object') return
    if (Array.isArray(node)) { node.forEach(child => visit(child, fn)); return }
    fn(node); visit(node.props?.children, fn)
  }
  const text = node => node == null ? '' : Array.isArray(node) ? node.map(text).join('') : typeof node !== 'object' ? String(node) : text(node.props?.children)
  const render = () => { cursor = 0; tree = exports.TeacherMode(); while (effects.length) effects.shift()() }
  const find = (type, label) => {
    render(); let found
    visit(tree, node => { if (node.type === type && (!label || text(node).includes(label))) found = node.props })
    assert.ok(found, `Missing ${type} ${label ?? ''}`); return found
  }
  render()
  return {
    alerts, downloads,
    switchProfile() { current = { id: 'B', name: 'Bob', avatar: 'male' }; render() },
    export: () => find('Button', 'Export Current Profile').onClick(),
    exportHandler: () => find('Button', 'Export Current Profile').onClick,
    import: file => find('input').onChange({ target: { files: [file] } }),
    exportDisabled: () => find('Button', 'Export Current Profile').disabled,
  }
}

test('TeacherMode retains the initiating profile across file reading and reports the actual imported profile', async () => {
  const h = await setup(), ui = mountTeacher(h), file = deferred()
  ui.import({ text: () => file.promise })
  assert.equal(ui.exportDisabled(), true)
  ui.switchProfile()
  file.resolve(JSON.stringify(backup({ srs: {}, activity: [] })))
  await tick(); await tick()
  assert.deepEqual(h.srs.A, {}); assert.deepEqual(h.srs.B, { other: item('other') })
  assert.match(ui.alerts[0], /successfully into Alice/)
  assert.equal(ui.exportDisabled(), false)
})

test('TeacherMode never announces import success when a native write rejects', async () => {
  const h = await setup({ overrides: { async clearEvents() { throw Error('disk full') } } }), ui = mountTeacher(h)
  ui.import({ text: async () => JSON.stringify(backup({ srs: {}, activity: [] })) })
  await tick(); await tick()
  assert.equal(ui.alerts.length, 1); assert.match(ui.alerts[0], /^Import failed:/)
  assert.doesNotMatch(ui.alerts[0], /successfully/)
  assert.match(ui.alerts[0], /Some profile data may have changed/)
  assert.equal(ui.exportDisabled(), false)
})

test('TeacherMode guards repeated backup clicks and exports the captured native profile', async () => {
  const gate = deferred(), h = await setup({ gate }), ui = mountTeacher(h), exportHandler = ui.exportHandler()
  const first = exportHandler(), repeated = exportHandler()
  ui.switchProfile(); gate.resolve(); await Promise.all([first, repeated])
  assert.equal(ui.downloads.length, 1)
  assert.equal(ui.downloads[0].name, 'profile-Alice-A.json')
  assert.deepEqual(ui.downloads[0].data.data.srs, h.srs.A)
  assert.equal(ui.downloads[0].data.profile.id, 'A')
  assert.equal(ui.alerts.length, 0)
})

test('TeacherMode blocks incomplete exports after a storage failure and allows a later retry', async () => {
  let failed = true
  const h = await setup({ overrides: { async srsLoadAll() { if (failed) throw Error('unavailable'); return {} } } }), ui = mountTeacher(h)
  await ui.export()
  assert.equal(ui.downloads.length, 0); assert.match(ui.alerts[0], /^Export failed:/)
  failed = false; await ui.export()
  assert.equal(ui.downloads.length, 1); assert.equal(ui.exportDisabled(), false)
})


test('a rejected SRS upsert never starts deleting existing profile items', async () => {
  const h = await setup({ overrides: { async srsUpsert() { throw Error('disk full') } } })
  await assert.rejects(h.api.importProfileBackup(backup({ srs: { [item().key]: item() }, activity: [] }), 'A'), /Some profile data may have changed/)
  assert.deepEqual(h.srs.A, { old: item('old') })
  assert.equal(h.writes.length, 0)
  assert.equal(h.activity.A.length, 1)
})

test('TeacherMode rejects malformed files without initializing storage or claiming success', async () => {
  const h = await setup(), ui = mountTeacher(h)
  ui.import({ text: async () => JSON.stringify(backup({ srs: {}, uiLang: { invalid: true } })) })
  await tick(); await tick()
  assert.equal(h.storageCalls(), 0); assert.equal(h.writes.length, 0)
  assert.equal(ui.alerts.length, 1); assert.match(ui.alerts[0], /Import failed: Invalid profile backup/)
  assert.equal(ui.exportDisabled(), false)
})
