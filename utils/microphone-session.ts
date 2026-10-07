export type MicrophoneState = "idle" | "starting" | "active"

type Options = {
  canStart: () => boolean
  getUserMedia: () => Promise<MediaStream>
  createAudioContext: () => AudioContext
  requestAnimationFrame: (callback: FrameRequestCallback) => number
  cancelAnimationFrame: (handle: number) => void
  renderFrame: (analyser: AnalyserNode) => boolean | void
  onStateChange: (state: MicrophoneState) => void
}

type Resources = {
  stream: MediaStream
  context: AudioContext | null
  source: MediaStreamAudioSourceNode | null
  analyser: AnalyserNode | null
}

function release(resources: Resources) {
  // A failing browser cleanup must not prevent the remaining resources releasing.
  for (const track of resources.stream.getTracks()) {
    try { track.stop() } catch {}
  }
  try { resources.source?.disconnect() } catch {}
  try { resources.analyser?.disconnect() } catch {}
  try { resources.context?.close().catch(() => {}) } catch {}
}

/** Owns one capture attempt, including permission requests that cannot be aborted. */
export function createMicrophoneSession(options: Options) {
  let state: MicrophoneState = "idle"
  let generation = 0
  let disposed = false
  let resources: Resources | null = null
  let frame: number | null = null

  const setState = (next: MicrophoneState) => {
    if (state === next) return
    state = next
    if (!disposed) options.onStateChange(next)
  }

  const stop = () => {
    generation++
    if (frame !== null) {
      options.cancelAnimationFrame(frame)
      frame = null
    }
    const previous = resources
    resources = null
    if (previous) release(previous)
    setState("idle")
  }

  const start = async () => {
    if (disposed || state !== "idle" || !options.canStart()) return
    const request = ++generation
    const isCurrent = () => !disposed && generation === request
    setState("starting")
    try {
      const stream = await options.getUserMedia()
      const acquired: Resources = { stream, context: null, source: null, analyser: null }
      // Permission may resolve after Stop, revocation, a profile change or unmount.
      if (!isCurrent() || !options.canStart()) {
        release(acquired)
        if (isCurrent()) stop()
        return
      }
      // Own the stream before creating any Web Audio resource, so failures clean up.
      resources = acquired
      const context = acquired.context = options.createAudioContext()
      const source = acquired.source = context.createMediaStreamSource(stream)
      const analyser = acquired.analyser = context.createAnalyser()
      analyser.fftSize = 2048
      source.connect(analyser)
      setState("active")
      const render = () => {
        if (!isCurrent()) return
        const rendered = options.renderFrame(analyser)
        if (isCurrent() && rendered !== false) frame = options.requestAnimationFrame(render)
      }
      render()
    } catch (error) {
      // An old denial cannot reset or report errors for a newer capture attempt.
      if (isCurrent()) {
        stop()
        throw error
      }
    }
  }

  return {
    start,
    stop,
    dispose() {
      disposed = true
      stop()
    },
  }
}
