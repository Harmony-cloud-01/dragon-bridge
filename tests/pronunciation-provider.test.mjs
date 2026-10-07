import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { runInNewContext } from 'node:vm'
import ts from 'typescript'

const tick = () => new Promise(resolve => setImmediate(resolve))
const deferred = () => {
  let resolve
  const promise = new Promise(done => { resolve = done })
  return { promise, resolve }
}

// Mount the actual provider and controller with mocked React/browser APIs.
// No browser, microphone, audio output, or storage device is accessed.
function mount({ speechAvailable = true, findAudio = async () => null, storageThrows = false, stored = {} } = {}) {
  const hooks = [], effects = [], timers = new Map(), events = []
  const utterances = [], recordings = [], toasts = [], storageErrors = [], logs = []
  let cursor = 0, timerId = 0, tree
  const same = (left, right) => left && right && left.length === right.length && left.every((item, i) => item === right[i])
  const react = {
    createContext: () => ({ Provider: 'Provider' }),
    useContext: () => tree.props.value,
    useState(initial) {
      const index = cursor++
      if (!(index in hooks)) hooks[index] = initial
      return [hooks[index], value => { hooks[index] = typeof value === 'function' ? value(hooks[index]) : value }]
    },
    useRef(initial) { const index = cursor++; return hooks[index] ??= { current: initial } },
    useMemo(fn, deps) {
      const index = cursor++
      if (!same(hooks[index]?.deps, deps)) hooks[index] = { deps, value: fn() }
      return hooks[index].value
    },
    useCallback(fn, deps) { return react.useMemo(() => fn, deps) },
    useEffect(fn, deps) {
      const index = cursor++
      if (!same(hooks[index]?.deps, deps)) {
        effects.push(() => { hooks[index]?.cleanup?.(); hooks[index] = { deps, cleanup: fn() } })
      }
    },
  }
  class Utterance { constructor(text) { this.text = text } }
  const speech = {
    cancelCount: 0,
    speak(utterance) { utterances.push(utterance); utterance.onstart?.() },
    cancel() { this.cancelCount++ },
    getVoices: () => [], addEventListener() {}, removeEventListener() {},
  }
  class Audio {
    constructor(src) { this.src = src; this.pauses = 0; recordings.push(this) }
    play() { return Promise.resolve() }
    pause() { this.pauses++ }
  }
  const toast = data => toasts.push(data)
  const window = {
    ...(speechAvailable ? { speechSynthesis: speech, SpeechSynthesisUtterance: Utterance } : {}),
    addEventListener() {}, removeEventListener() {}, dispatchEvent(event) { events.push(event) },
  }
  const mocks = {
    react,
    'react/jsx-runtime': { jsx: (type, props) => ({ type, props }) },
    '@/hooks/use-toast': { useToast: () => ({ toast }) },
    '@/utils/activity-log': { logEvent: event => logs.push(event) },
    '@/storage/failure': { reportStorageFailure: action => storageErrors.push(action) },
    '@/utils/profile-storage': { scopedKey: key => key },
    '@/utils/offline': { isOffline: () => false },
    '@/utils/lessons': { findAudioFor: findAudio, preloadLessons() {} },
    '@/stores/settings': { getPreferLocalAudio: () => false },
    '@/lib/tones': { analyzeTones: async () => [] },
  }
  const globals = {
    window, navigator: { userAgent: 'Mozilla/5.0 (Linux; Android 14) Mobile' },
    Audio,
    ...(speechAvailable ? { speechSynthesis: speech, SpeechSynthesisUtterance: Utterance } : {}),
    CustomEvent: class { constructor(type, init) { this.type = type; this.detail = init?.detail } },
    localStorage: {
      getItem: key => stored[key] ?? null,
      setItem() { if (storageThrows) throw new Error('QuotaExceededError') },
      removeItem() { if (storageThrows) throw new Error('SecurityError') },
    },
    setTimeout(fn) { const id = timerId++; timers.set(id, fn); return id },
    clearTimeout(id) { timers.delete(id) },
  }
  function load(path) {
    const exports = {}
    const sourcePath = path === 'components/dialect-provider.tsx' && process.env.DIALECT_PROVIDER_TEST_SOURCE
      ? process.env.DIALECT_PROVIDER_TEST_SOURCE : new URL(`../${path}`, import.meta.url)
    const js = ts.transpileModule(readFileSync(sourcePath, 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
    }).outputText
    runInNewContext(js, { ...globals, exports, require(name) {
      if (name in mocks) return mocks[name]
      if (name === '@/lib/pronunciation-player') return load('lib/pronunciation-player.ts')
      throw new Error(`Unexpected import ${name}`)
    } }, { filename: path })
    return exports
  }
  const { DialectProvider } = load('components/dialect-provider.tsx')
  function render() {
    cursor = 0
    tree = DialectProvider({ children: null })
    while (effects.length) effects.shift()()
    return tree.props.value
  }
  render()
  render()
  return {
    render, utterances, recordings, toasts, events, storageErrors, logs, speech,
    unmount() { hooks.forEach(hook => hook?.cleanup?.()) },
  }
}

test('an actual provider mobile tap calls speech synchronously and resets visible state on end', async () => {
  const h = mount()
  const pending = h.render().playPronunciation('你好')
  assert.equal(h.utterances.length, 1)
  assert.equal(h.render().isPlaying, true)
  await pending
  h.utterances[0].onend()
  assert.equal(h.render().isPlaying, false)
  assert.equal(h.render().currentlyPlaying, null)
  assert.equal(h.toasts.length, 0)
  h.unmount()
})

test('the actual provider plays catalogue URLs and stops without any speech globals', async () => {
  const h = mount({ speechAvailable: false, findAudio: async () => '/dragon-bridge/audio/hello.mp3' })
  await h.render().playPronunciation('你好')
  assert.equal(h.recordings[0].src, '/dragon-bridge/audio/hello.mp3')
  assert.equal(h.render().isPlaying, true)
  assert.equal(h.render().speechSupported, false)
  h.render().stopAudio()
  assert.equal(h.recordings[0].pauses, 1)
  assert.equal(h.render().isPlaying, false)
  h.unmount()
})

test('provider reports unavailable recordings and unmount cancels a pending catalogue lookup', async () => {
  const empty = mount({ speechAvailable: false })
  await empty.render().playPronunciation('你好')
  assert.equal(empty.render().isPlaying, false)
  assert.match(empty.toasts[0].description, /No recording is available/)
  assert.equal(empty.recordings.length, 0)
  assert.equal(empty.logs.length, 0)
  empty.unmount()

  const lookup = deferred()
  const h = mount({ speechAvailable: false, findAudio: () => lookup.promise })
  const pending = h.render().playPronunciation('你好')
  h.unmount()
  lookup.resolve('/audio/hello.mp3')
  await pending
  await tick()
  assert.equal(h.recordings.length, 0)
})

test('blocked preference writes are visible and do not prevent mobile speech', async () => {
  const h = mount({ storageThrows: true })
  assert.equal(new Set(h.storageErrors).size, 3)
  await h.render().playPronunciation('你好')
  assert.equal(h.utterances.length, 1)
  h.unmount()
})


test('provider restores raw legacy preferred-voice strings used by profile backups', () => {
  const h = mount({ stored: { 'dialect.v2.preferredVoice': 'Mandarin Voice' } })
  assert.equal(h.render().preferredVoiceName, 'Mandarin Voice')
  h.unmount()
})
