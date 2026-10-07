import assert from "node:assert/strict"
import test from "node:test"
import { createMicrophoneSession } from "../utils/microphone-session.ts"

function deferred() {
  let resolve
  let reject
  const promise = new Promise((res, rej) => { resolve = res; reject = rej })
  return { promise, resolve, reject }
}

function makeStream() {
  const tracks = [0, 0]
  return {
    stopped: tracks,
    stream: { getTracks: () => tracks.map((_, i) => ({ stop: () => { tracks[i]++ } })) },
  }
}

function setup() {
  const requests = []
  const contexts = []
  const frames = new Map()
  const cancelled = []
  const states = []
  let consent = true
  let renders = 0
  let nextFrame = 0
  let failAt = null
  let throwOnClose = false
  const session = createMicrophoneSession({
    canStart: () => consent,
    getUserMedia: () => {
      const request = deferred()
      requests.push(request)
      return request.promise
    },
    createAudioContext: () => {
      if (failAt === "context") throw new Error("context failed")
      const stats = { closed: 0, sourceDisconnected: 0, analyserDisconnected: 0 }
      contexts.push(stats)
      return {
        createMediaStreamSource: () => {
          if (failAt === "source") throw new Error("source failed")
          return {
            connect: () => { if (failAt === "connect") throw new Error("connect failed") },
            disconnect: () => { stats.sourceDisconnected++ },
          }
        },
        createAnalyser: () => {
          if (failAt === "analyser") throw new Error("analyser failed")
          return { fftSize: 0, disconnect: () => { stats.analyserDisconnected++ } }
        },
        close: () => {
          stats.closed++
          if (throwOnClose) throw new Error("close failed")
          return Promise.resolve()
        },
      }
    },
    requestAnimationFrame: (callback) => { const id = nextFrame++; frames.set(id, callback); return id },
    cancelAnimationFrame: (id) => { cancelled.push(id); frames.delete(id) },
    renderFrame: () => { renders++ },
    onStateChange: (state) => { states.push(state) },
  })
  return {
    session, requests, contexts, frames, cancelled, states,
    setConsent: (value) => { consent = value },
    failAt: (stage) => { failAt = stage },
    failClose: () => { throwOnClose = true },
    get renders() { return renders },
  }
}

test("Stop releases every track, node, context and animation exactly once", async () => {
  const h = setup()
  const media = makeStream()
  const start = h.session.start()
  h.requests[0].resolve(media.stream)
  await start
  assert.deepEqual(h.states, ["starting", "active"])
  const queuedFrame = h.frames.get(0)
  h.session.stop()
  h.session.stop()
  assert.deepEqual(media.stopped, [1, 1])
  assert.deepEqual(h.contexts, [{ closed: 1, sourceDisconnected: 1, analyserDisconnected: 1 }])
  assert.deepEqual(h.cancelled, [0], "RAF handle 0 must also be cancelled")
  const renders = h.renders
  queuedFrame(0)
  assert.equal(h.renders, renders, "a queued callback cannot restart a stopped session")
  assert.equal(h.frames.size, 0)
})

test("unmount disposes active capture without publishing state updates", async () => {
  const h = setup()
  const media = makeStream()
  const start = h.session.start()
  h.requests[0].resolve(media.stream)
  await start
  const states = [...h.states]
  h.session.dispose()
  h.session.dispose()
  await h.session.start()
  assert.deepEqual(h.states, states)
  assert.deepEqual(media.stopped, [1, 1])
  assert.equal(h.contexts[0].closed, 1)
  assert.equal(h.requests.length, 1)
})

for (const interruption of ["stop", "dispose"] ) {
  test(`${interruption} invalidates a pending permission request and stops its late stream`, async () => {
    const h = setup()
    const media = makeStream()
    const start = h.session.start()
    h.session[interruption]()
    const states = [...h.states]
    h.requests[0].resolve(media.stream)
    await start
    assert.deepEqual(media.stopped, [1, 1])
    assert.deepEqual(h.states, states)
    assert.equal(h.contexts.length, 0)
    assert.equal(h.frames.size, 0)
  })
}

test("repeated Start clicks while permission is pending request only one stream", async () => {
  const h = setup()
  const first = h.session.start()
  await h.session.start()
  assert.equal(h.requests.length, 1)
  const media = makeStream()
  h.requests[0].resolve(media.stream)
  await first
  await h.session.start()
  assert.equal(h.requests.length, 1)
  h.session.dispose()
})

test("a late old stream cannot replace or stop a newer session", async () => {
  const h = setup()
  const oldMedia = makeStream()
  const newMedia = makeStream()
  const oldStart = h.session.start()
  h.session.stop()
  const newStart = h.session.start()
  h.requests[1].resolve(newMedia.stream)
  await newStart
  h.requests[0].resolve(oldMedia.stream)
  await oldStart
  assert.deepEqual(oldMedia.stopped, [1, 1])
  assert.deepEqual(newMedia.stopped, [0, 0])
  assert.equal(h.contexts.length, 1)
  assert.equal(h.contexts[0].closed, 0)
  h.session.dispose()
})

test("consent is checked both before acquisition and after permission resolves", async () => {
  const h = setup()
  h.setConsent(false)
  await h.session.start()
  assert.equal(h.requests.length, 0)
  h.setConsent(true)
  const start = h.session.start()
  h.setConsent(false)
  const media = makeStream()
  h.requests[0].resolve(media.stream)
  await start
  assert.deepEqual(media.stopped, [1, 1])
  assert.equal(h.contexts.length, 0)
  assert.equal(h.states.at(-1), "idle")
})

for (const stage of ["context", "source", "analyser", "connect"] ) {
  test(`${stage} setup failure releases acquired resources and permits a retry`, async () => {
    const h = setup()
    h.failAt(stage)
    const media = makeStream()
    const start = h.session.start()
    h.requests[0].resolve(media.stream)
    await assert.rejects(start, new RegExp(`${stage} failed`))
    assert.deepEqual(media.stopped, [1, 1])
    assert.equal(h.states.at(-1), "idle")
    if (stage !== "context") assert.equal(h.contexts[0].closed, 1)
    h.failAt(null)
    const retry = h.session.start()
    const retryMedia = makeStream()
    h.requests[1].resolve(retryMedia.stream)
    await retry
    assert.equal(h.states.at(-1), "active")
    h.session.dispose()
  })
}

test("permission denial resets pending state; a stale denial cannot change a new session", async () => {
  const h = setup()
  const denied = h.session.start()
  h.requests[0].reject(new Error("denied"))
  await assert.rejects(denied, /denied/)
  assert.equal(h.states.at(-1), "idle")
  const old = h.session.start()
  h.session.stop()
  const active = h.session.start()
  h.requests[2].resolve(makeStream().stream)
  await active
  h.requests[1].reject(new Error("old denial"))
  await old
  assert.equal(h.states.at(-1), "active")
  h.session.dispose()
})

test("a throwing close cannot prevent track release or allow stale frames", async () => {
  const h = setup()
  const media = makeStream()
  const start = h.session.start()
  h.requests[0].resolve(media.stream)
  await start
  h.failClose()
  assert.doesNotThrow(() => h.session.stop())
  assert.deepEqual(media.stopped, [1, 1])
  assert.equal(h.frames.size, 0)
})
