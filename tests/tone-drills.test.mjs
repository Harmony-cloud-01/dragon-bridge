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

function makeStream() {
  let stops = 0
  return { stream: { getTracks: () => [{ stop: () => { stops++ } }] }, get stops() { return stops } }
}

// Render the actual component with mocked React hooks and browser media APIs.
// Nothing in this suite can access a microphone or create a real AudioContext.
async function mount() {
  const slots = [], effects = [], cleanups = [], requests = [], contexts = []
  const frames = new Map(), listeners = new Map()
  let cursor = 0, consent = true, mounted = true, nextFrame = 0
  const React = {
    useState(initial) {
      const index = cursor++
      if (!(index in slots)) slots[index] = initial
      return [slots[index], value => { if (mounted) slots[index] = typeof value === 'function' ? value(slots[index]) : value }]
    },
    useRef(initial) { const index = cursor++; return slots[index] ??= { current: initial } },
    useEffect(effect) { const index = cursor++; if (!(index in slots)) { slots[index] = true; effects.push(effect) } },
    useMemo(fn) { cursor++; return fn() },
  }
  const window = {
    addEventListener(name, fn) { if (!listeners.has(name)) listeners.set(name, new Set()); listeners.get(name).add(fn) },
    removeEventListener(name, fn) { listeners.get(name)?.delete(fn) },
    dispatchEvent(event) { for (const fn of listeners.get(event.type) ?? []) fn(event) },
    clearTimeout() {},
  }
  class AudioContext {
    constructor() { this.closed = 0; contexts.push(this) }
    createMediaStreamSource(stream) { return { mediaStream: stream, connect() {}, disconnect() {} } }
    createAnalyser() { return { fftSize: 2048, getByteTimeDomainData() {}, disconnect() {} } }
    close() { this.closed++; return Promise.resolve() }
  }
  window.AudioContext = AudioContext
  const mocks = {
    react: React,
    'react/jsx-runtime': { jsx: (type, props) => ({ type, props }), jsxs: (type, props) => ({ type, props }) },
    '@/hooks/use-dialect': { useDialect: () => ({ playPronunciation: async () => {}, playWithToneDisplay: async () => {}, isPlaying: false }) },
    './i18n-provider': { useI18n: () => ({ t: key => key }) },
    '@/hooks/use-toast': { useToast: () => ({ toast() {} }) },
    '@/stores/consent': {
      getConsent: () => consent,
      setConsent: value => { consent = value; window.dispatchEvent({ type: 'consent:changed', detail: value }) },
    },
    '@/utils/offline': { isOffline: () => false },
    '@/utils/device': { isLowRam: false },
  }
  const globals = {
    window,
    localStorage: { getItem: () => null, removeItem() {} },
    navigator: { mediaDevices: { getUserMedia: () => { const request = deferred(); requests.push(request); return request.promise } } },
    requestAnimationFrame: callback => { const id = nextFrame++; frames.set(id, callback); return id },
    cancelAnimationFrame: id => frames.delete(id),
    console: { warn() {} }, Uint8Array,
  }
  function load(path) {
    const exports = {}
    const js = ts.transpileModule(readFileSync(new URL(`../${path}`, import.meta.url), 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
    }).outputText
    runInNewContext(js, { ...globals, exports, require(name) {
      if (name in mocks) return mocks[name]
      if (name === '@/utils/microphone-session') return load('utils/microphone-session.ts')
      return new Proxy({}, { get: (_, key) => key })
    } }, { filename: path })
    return exports
  }
  const { ToneDrills } = load('components/tone-drills.tsx')
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
    cursor = 0
    tree = ToneDrills()
    visit(tree, node => {
      if (node.type === 'canvas') node.props.ref.current = { width: 800, height: 160, getContext: () => new Proxy({}, { get: () => () => {} }) }
    })
    while (effects.length) cleanups.push(effects.shift()())
  }
  function find(type, label) {
    render()
    let found
    visit(tree, node => { if (node.type === type && (!label || text(node).includes(label))) found = node })
    assert.ok(found, `Missing ${type} ${label ?? ''}`)
    return found.props
  }
  render()
  return {
    requests, contexts, frames,
    start: () => find('Button', 'Start Mic').onClick(),
    startHandler: () => find('Button', 'Start Mic').onClick,
    stop: () => find('Button', 'Stop Mic').onClick(),
    cancel: () => find('Button', 'Cancel Mic').onClick(),
    revoke: () => find('Switch').onCheckedChange(false),
    externalConsent: value => { consent = value; window.dispatchEvent({ type: 'consent:changed', detail: value }) },
    switchProfile: value => { consent = value; window.dispatchEvent({ type: 'profile:changed' }) },
    consent: () => find('Switch').checked,
    unmount: () => { mounted = false; cleanups.forEach(cleanup => cleanup?.()) },
  }
}

test('ToneDrills unmount stops active microphone tracks', async () => {
  const h = await mount(), media = makeStream(), start = h.start()
  h.requests[0].resolve(media.stream)
  await start
  h.unmount()
  assert.equal(media.stops, 1)
  assert.equal(h.contexts[0].closed, 1)
  assert.equal(h.frames.size, 0)
})

test('ToneDrills ignores a permission grant after unmount', async () => {
  const h = await mount(), media = makeStream(), start = h.start()
  h.unmount()
  h.requests[0].resolve(media.stream)
  await start
  assert.equal(media.stops, 1)
  assert.equal(h.contexts.length, 0)
})

test('ToneDrills does not acquire overlapping streams on repeated Start clicks', async () => {
  const h = await mount()
  // Invoke the same handler twice, as happens before a render processes state.
  const start = h.startHandler()
  const first = start()
  const second = start()
  assert.equal(h.requests.length, 1)
  h.unmount()
  h.requests[0].resolve(makeStream().stream)
  await Promise.all([first, second])
})

for (const change of ['revoke', 'externalConsent', 'switchProfile']) {
  test(`ToneDrills ${change} releases active capture and refreshes consent`, async () => {
    const h = await mount(), media = makeStream(), start = h.start()
    h.requests[0].resolve(media.stream)
    await start
    h[change](false)
    assert.equal(media.stops, 1)
    assert.equal(h.consent(), false)
    assert.equal(h.frames.size, 0)
    h.unmount()
  })
  test(`ToneDrills ${change} invalidates pending capture`, async () => {
    const h = await mount(), media = makeStream(), start = h.start()
    h[change](false)
    h.requests[0].resolve(media.stream)
    await start
    assert.equal(media.stops, 1)
    assert.equal(h.contexts.length, 0)
    h.unmount()
  })
}

test('switching between consenting profiles still stops the previous profile capture', async () => {
  const h = await mount(), media = makeStream(), start = h.start()
  h.requests[0].resolve(media.stream)
  await start
  h.switchProfile(true)
  assert.equal(media.stops, 1)
  assert.equal(h.consent(), true)
  h.unmount()
})

test('ToneDrills cancels a pending request and starts a new one safely', async () => {
  const h = await mount(), oldMedia = makeStream(), newMedia = makeStream()
  const oldStart = h.start()
  h.cancel()
  const newStart = h.start()
  h.requests[1].resolve(newMedia.stream)
  await newStart
  h.requests[0].resolve(oldMedia.stream)
  await oldStart
  assert.equal(oldMedia.stops, 1)
  assert.equal(newMedia.stops, 0)
  h.stop()
  assert.equal(newMedia.stops, 1)
  h.unmount()
})
