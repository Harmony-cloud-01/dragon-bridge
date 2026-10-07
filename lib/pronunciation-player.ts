export type PlaybackOptions = {
  offline: boolean
  preferLocal: boolean
  rate: number
  voice?: SpeechSynthesisVoice
}

export type PlaybackState = { text: string; dialectCode: string } | null
export type PlaybackFailure = "no-recording" | "playback-failed" | "not-allowed"

type Dependencies = {
  getSpeech: () => SpeechSynthesis | null
  createUtterance: (text: string) => SpeechSynthesisUtterance
  findAudio: (text: string, dialectCode: string) => Promise<string | null>
  createAudio: (src: string) => HTMLAudioElement
  onState: (state: PlaybackState) => void
  onUnavailable: (reason: PlaybackFailure) => void
  onStarted: (text: string, dialectCode: string, audio?: HTMLAudioElement) => void
}

function deferred() {
  let resolve!: (value: boolean) => void
  const promise = new Promise<boolean>((done) => { resolve = done })
  return { promise, resolve }
}

export function getBrowserSpeech(): SpeechSynthesis | null {
  if (typeof window === "undefined" || typeof window.SpeechSynthesisUtterance !== "function") return null
  const speech = window.speechSynthesis
  return speech && typeof speech.speak === "function" && typeof speech.cancel === "function" ? speech : null
}

// One request owns all media and callbacks until it finishes or is superseded.
// No browser/user-agent gate: supported speech begins synchronously on a tap.
export function createPronunciationPlayer(deps: Dependencies) {
  let revision = 0
  let cancelCurrent: (() => void) | null = null

  function stop() {
    revision += 1
    const cancel = cancelCurrent
    cancelCurrent = null
    cancel?.()
  }

  function play(text: string, dialectCode: string, options: PlaybackOptions) {
    stop()
    const requestId = revision
    const started = deferred()
    const finished = deferred()
    let settled = false
    let didStart = false
    let mediaStarted = false
    let succeeded = false
    let audio: HTMLAudioElement | null = null
    let utterance: SpeechSynthesisUtterance | null = null
    let speech: SpeechSynthesis | null = null
    const isCurrent = () => revision === requestId
    const isActive = () => isCurrent() && !settled

    function releaseMedia(cancelSpeech: boolean) {
      mediaStarted = false
      if (audio) {
        audio.onended = null
        audio.onerror = null
        try { audio.pause() } catch {}
        try { audio.currentTime = 0 } catch {}
        audio = null
      }
      if (utterance) {
        utterance.onstart = null
        utterance.onend = null
        utterance.onerror = null
        utterance = null
        if (cancelSpeech) {
          try { speech?.cancel() } catch {}
        }
      }
    }

    function finish(success: boolean, cancelSpeech = false) {
      if (settled) return
      settled = true
      succeeded = success
      releaseMedia(cancelSpeech)
      started.resolve(didStart)
      finished.resolve(success)
      // stop() invalidates before cancellation; this request still owns cleanup.
      deps.onState(null)
      if (isCurrent()) cancelCurrent = null
    }

    function fail(reason: PlaybackFailure) {
      if (!isActive()) return
      finish(false, true)
      deps.onUnavailable(reason)
    }

    function markStarted(element?: HTMLAudioElement) {
      if (!isActive() || mediaStarted) return
      mediaStarted = true
      didStart = true
      started.resolve(true)
      deps.onStarted(text, dialectCode, element)
    }

    function startSpeech() {
      if (!isActive() || !speech) return
      try {
        const current = deps.createUtterance(text)
        utterance = current
        current.lang = dialectCode
        current.rate = options.rate
        current.pitch = dialectCode.includes("northeast") ? 1.1 : 1
        if (options.voice) current.voice = options.voice
        current.onstart = () => {
          if (utterance === current) markStarted()
        }
        current.onend = () => {
          if (isActive() && utterance === current) finish(true)
        }
        current.onerror = (event) => {
          if (!isActive() || utterance !== current) return
          releaseMedia(false)
          if (event.error === "canceled" || event.error === "interrupted") {
            finish(false)
          } else if (event.error === "not-allowed") {
            fail("not-allowed")
          } else {
            void startRecording(false)
          }
        }
        speech.speak(current)
      } catch {
        releaseMedia(true)
        void startRecording(false)
      }
    }

    async function startRecording(allowSpeech: boolean) {
      try {
        const src = await deps.findAudio(text, dialectCode)
        if (!isActive()) return
        if (!src) {
          if (allowSpeech && speech) startSpeech()
          else fail("no-recording")
          return
        }
        const current = deps.createAudio(src)
        audio = current
        current.playbackRate = options.rate
        current.onended = () => {
          if (isActive() && audio === current) finish(true)
        }
        current.onerror = () => {
          if (isActive() && audio === current) fail("playback-failed")
        }
        await current.play()
        if (isActive() && audio === current) markStarted(current)
      } catch (error) {
        if (!isActive()) return
        const reason = error && typeof error === "object" && "name" in error && error.name === "NotAllowedError"
          ? "not-allowed" : "playback-failed"
        fail(reason)
      }
    }

    cancelCurrent = () => finish(false, true)
    deps.onState({ text, dialectCode })
    try { speech = deps.getSpeech() } catch { speech = null }
    if (options.offline || options.preferLocal || !speech) {
      void startRecording(!options.offline)
    } else {
      startSpeech()
    }
    return { started: started.promise, finished: finished.promise, isCurrent: () => isCurrent() && (!settled || succeeded) }
  }

  async function playBoth(
    text: string,
    primaryDialect: string,
    options: PlaybackOptions | ((dialectCode: string) => PlaybackOptions),
  ) {
    const settings = (code: string) => typeof options === "function" ? options(code) : options
    const first = play(text, "zh-CN", settings("zh-CN"))
    if (await first.finished && first.isCurrent() && primaryDialect !== "zh-CN") {
      await play(text, primaryDialect, settings(primaryDialect)).finished
    }
  }

  return { play, playBoth, stop }
}
