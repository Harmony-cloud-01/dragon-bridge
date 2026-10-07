import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createPronunciationPlayer } from '../lib/pronunciation-player.ts'

const deferred = () => {
  let resolve, reject
  const promise = new Promise((yes, no) => { resolve = yes; reject = no })
  return { promise, resolve, reject }
}
const tick = () => new Promise(resolve => setImmediate(resolve))

function harness(overrides = {}) {
  const states = [], failures = [], recorded = [], utterances = [], started = []
  const speech = {
    cancelCount: 0,
    cancel() { this.cancelCount++ },
    speak(utterance) { utterances.push(utterance); utterance.onstart?.() },
  }
  const player = createPronunciationPlayer({
    getSpeech: () => speech,
    createUtterance: text => ({ text }),
    findAudio: async () => null,
    createAudio(src) {
      const audio = {
        src, currentTime: 10, pauseCount: 0, playbackRate: 1,
        pause() { this.pauseCount++ },
        play() { return Promise.resolve() },
      }
      recorded.push(audio)
      return audio
    },
    onState: state => states.push(state),
    onUnavailable: reason => failures.push(reason),
    onStarted: (text, dialectCode, audio) => started.push({ text, dialectCode, audio }),
    ...overrides,
  })
  return { player, states, failures, recorded, utterances, speech, started }
}

const options = { offline: false, preferLocal: false, rate: 0.8 }

test('mobile-capable speech starts synchronously in the tap handler and clears on end', async () => {
  const h = harness()
  const request = h.player.play('你好', 'zh-CN', options)
  assert.equal(h.utterances.length, 1, 'do not await a catalogue fetch before browser speech')
  assert.equal(h.utterances[0].rate, 0.8)
  assert.equal(await request.started, true)
  h.utterances[0].onend()
  assert.equal(await request.finished, true)
  assert.equal(h.states.at(-1), null)
})

test('recorded-only browsers do not touch missing speech APIs', async () => {
  const h = harness({ getSpeech: () => null, findAudio: async () => '/dragon-bridge/audio/zh-CN/hello.mp3' })
  const request = h.player.play('你好', 'zh-CN', options)
  assert.equal(await request.started, true)
  assert.equal(h.recorded[0].src, '/dragon-bridge/audio/zh-CN/hello.mp3')
  assert.equal(h.recorded[0].playbackRate, 0.8)
  h.player.stop()
  assert.equal(await request.finished, false)
  assert.equal(h.recorded[0].pauseCount, 1)
  assert.equal(h.recorded[0].currentTime, 0)
  assert.equal(h.states.at(-1), null)
})

test('an empty catalogue reports no recording without requesting an invented filename', async () => {
  const h = harness({ getSpeech: () => null })
  const request = h.player.play('你好', 'zh-CN', options)
  assert.equal(await request.started, false)
  assert.equal(await request.finished, false)
  assert.deepEqual(h.failures, ['no-recording'])
  assert.equal(h.recorded.length, 0)
  assert.equal(h.states.at(-1), null)
})

test('offline empty catalogue reports unavailable even if speech exists', async () => {
  const h = harness()
  const request = h.player.play('你好', 'zh-CN', { ...options, offline: true })
  assert.equal(await request.finished, false)
  assert.equal(h.utterances.length, 0)
  assert.deepEqual(h.failures, ['no-recording'])
})

test('prefer-local with no recording falls back to supported browser speech', async () => {
  const h = harness()
  const request = h.player.play('你好', 'zh-CN', { ...options, preferLocal: true })
  assert.equal(await request.started, true)
  assert.equal(h.utterances.length, 1)
  assert.deepEqual(h.failures, [])
  h.player.stop()
})

test('a late catalogue response cannot restart playback after stop or replace a newer request', async () => {
  const lookup = deferred()
  const h = harness({ findAudio: () => lookup.promise })
  const old = h.player.play('old', 'zh-CN', { ...options, preferLocal: true })
  const current = h.player.play('new', 'zh-CN', options)
  lookup.resolve('/dragon-bridge/audio/old.mp3')
  await tick()
  assert.equal(h.recorded.length, 0)
  assert.equal(await old.finished, false)
  assert.equal(await current.started, true)
  assert.equal(h.states.at(-1).text, 'new')
  h.player.stop()

  const pending = deferred()
  const stopped = harness({ getSpeech: () => null, findAudio: () => pending.promise })
  const request = stopped.player.play('你好', 'zh-CN', options)
  stopped.player.stop()
  pending.resolve('/audio/hello.mp3')
  await tick()
  assert.equal(await request.finished, false)
  assert.equal(stopped.recorded.length, 0)
})

test('cancelled utterance callbacks cannot stop or fall back over newer speech', async () => {
  const h = harness()
  const old = h.player.play('old', 'zh-CN', options)
  const staleEnd = h.utterances[0].onend
  const staleError = h.utterances[0].onerror
  const current = h.player.play('new', 'zh-CN', options)
  staleEnd()
  staleError({ error: 'canceled' })
  await tick()
  assert.equal(await old.finished, false)
  assert.equal(await current.started, true)
  assert.equal(h.states.at(-1).text, 'new')
  assert.equal(h.recorded.length, 0)
  assert.equal(h.speech.cancelCount, 1)
  h.player.stop()
})

test('late play rejection and duplicate audio events cannot reset a newer request', async () => {
  const pending = deferred()
  const h = harness({
    getSpeech: () => null,
    findAudio: async text => `/audio/${text}.mp3`,
  })
  const original = h.player.play('old', 'zh-CN', options)
  await original.started
  const oldAudio = h.recorded[0]
  const oldEnd = oldAudio.onended
  const oldError = oldAudio.onerror
  const current = h.player.play('new', 'zh-CN', options)
  await current.started
  oldEnd()
  oldError()
  assert.equal(h.states.at(-1).text, 'new')
  assert.equal(h.recorded[1].pauseCount, 0)
  assert.deepEqual(h.failures, [])
  h.player.stop()

  const blocked = harness({
    getSpeech: () => null,
    findAudio: async () => '/audio/pending.mp3',
    createAudio: () => ({ play: () => pending.promise, pause() {} }),
  })
  const request = blocked.player.play('pending', 'zh-CN', options)
  await tick()
  blocked.player.stop()
  pending.reject(Object.assign(new Error('blocked'), { name: 'NotAllowedError' }))
  await tick()
  assert.equal(await request.started, false)
  assert.deepEqual(blocked.failures, [])
})

test('autoplay denial is reported once, resets state, and remains retryable', async () => {
  const h = harness({
    getSpeech: () => null,
    findAudio: async () => '/audio/hello.mp3',
    createAudio: () => ({
      play() { this.onerror(); return Promise.reject(Object.assign(new Error('blocked'), { name: 'NotAllowedError' })) },
      pause() {},
    }),
  })
  const request = h.player.play('你好', 'zh-CN', options)
  assert.equal(await request.finished, false)
  await tick()
  assert.equal(h.failures.length, 1)
  assert.equal(h.states.at(-1), null)
})

test('speech failure uses the catalogue fallback and stop cancels its pending lookup', async () => {
  const lookup = deferred()
  const h = harness({ findAudio: () => lookup.promise })
  const request = h.player.play('你好', 'zh-CN', options)
  h.utterances[0].onerror({ error: 'synthesis-failed' })
  h.player.stop()
  lookup.resolve('/audio/fallback.mp3')
  await tick()
  assert.equal(await request.finished, false)
  assert.equal(h.recorded.length, 0)
})

test('two-dialect playback waits for recorded audio to end, and stop cancels the second', async () => {
  const h = harness({ getSpeech: () => null, findAudio: async (_, code) => `/audio/${code}/hello.mp3` })
  const done = h.player.playBoth('你好', 'zh-CN-northeast', options)
  await tick()
  assert.equal(h.recorded.length, 1)
  h.recorded[0].onended()
  await tick()
  assert.equal(h.recorded.length, 2)
  h.recorded[1].onended()
  await done

  const stopped = h.player.playBoth('你好', 'zh-CN-northeast', options)
  await tick()
  h.player.stop()
  await stopped
  assert.equal(h.recorded.length, 3)
})

test('provider routes mobile taps to the tested lifecycle and cleans up on unmount', async () => {
  const source = await readFile(new URL('../components/dialect-provider.tsx', import.meta.url), 'utf8')
  assert.doesNotMatch(source, /if\s*\(isMobile\)\s*\{[^}]*return/s)
  assert.match(source, /createPronunciationPlayer/)
  assert.match(source, /return\s*\(\)\s*=>\s*player\.stop\(/)
})

test('a real autoplay rejection reports the actionable reason and a later tap can succeed', async () => {
  let blocked = true
  const h = harness({
    getSpeech: () => null,
    findAudio: async () => '/audio/hello.mp3',
    createAudio: () => ({
      play: () => blocked
        ? Promise.reject(Object.assign(new Error('blocked'), { name: 'NotAllowedError' }))
        : Promise.resolve(),
      pause() {},
    }),
  })
  assert.equal(await h.player.play('你好', 'zh-CN', options).finished, false)
  assert.deepEqual(h.failures, ['not-allowed'])
  blocked = false
  assert.equal(await h.player.play('你好', 'zh-CN', options).started, true)
  h.player.stop()
})

test('stale speech-start events are ignored after recording fallback', async () => {
  const h = harness({
    getSpeech: () => ({ speak(utterance) { h.utterances.push(utterance) }, cancel() {} }),
    findAudio: async () => '/audio/hello.mp3',
  })
  const request = h.player.play('你好', 'zh-CN', options)
  const staleStart = h.utterances[0].onstart
  h.utterances[0].onerror({ error: 'synthesis-failed' })
  staleStart()
  assert.equal(h.started.length, 0)
  await request.started
  assert.equal(h.started.length, 1)
  assert.ok(h.started[0].audio)
  h.player.stop()
})

test('a failed or interrupted request is no longer current for pending tone analysis', async () => {
  const h = harness()
  const request = h.player.play('你好', 'zh-CN', options)
  await request.started
  h.utterances[0].onerror({ error: 'interrupted' })
  assert.equal(await request.finished, false)
  assert.equal(request.isCurrent(), false)
})

test('stop between natural end and the sequence continuation prevents its second dialect', async () => {
  const h = harness()
  const done = h.player.playBoth('你好', 'zh-CN-northeast', options)
  h.utterances[0].onend()
  h.player.stop()
  await done
  assert.equal(h.utterances.length, 1)
})
