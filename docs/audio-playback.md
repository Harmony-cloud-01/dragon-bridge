# Pronunciation playback and verification

## Current content limit

This checkout ships an empty `public/lessons.json` recording catalogue and no
`public/audio/` recordings. Browser text-to-speech can still pronounce phrases
when the browser and installed voices support it. Selecting “Prefer pre-recorded
audio” does not download recordings or add offline speech support.

When offline, or when browser speech is unavailable or fails, the player looks
up an actual recording in `public/lessons.json`. If none is listed, it reports
“Audio unavailable”. It does not invent a filename or claim that audio was
cached. A listed recording can still fail if its file is absent, uncached while
offline, or unsupported by the browser. Regional dialect selections may use an
available Mandarin voice or the catalogue's existing standard-Mandarin fallback;
this is not a guarantee of authentic dialect pronunciation.

## Playback behavior

- A Play tap reaches supported browser speech on mobile and desktop. There is no
  blanket mobile block and no catalogue fetch before default browser speech.
- “Prefer pre-recorded audio” tries a catalogue entry first. If no entry exists
  while online, supported browser speech is used.
- The recording player does not require `speechSynthesis`. It applies playback
  speed and resolves catalogue URLs with the application's deployment base path.
- Stop, a newer Play, and provider unmount invalidate outstanding lookups and
  playback callbacks. Late errors/end events cannot cancel a newer phrase.
- “Both dialects” waits for either recorded or synthesized audio to finish. Stop
  cancels the remaining sequence.
- Browser autoplay denial prompts another explicit Play tap. Missing recordings
  and failed playback clear the busy state rather than pretending to succeed.

## Automated checks

Run with Node 24 (built-in TypeScript stripping; no microphone or audio device):

```sh
node --test tests/pronunciation*.test.mjs tests/audio-base-path.test.mjs
```

The tests mock speech synthesis, recordings, and delayed promises, and mount
the actual provider using mocked React/browser APIs. They cover
synchronous speech startup, absent APIs, recorded-only playback, empty catalogues,
offline/prefer-local selection, playback rate, missing/unplayable files, autoplay
rejection and retry, stop/repeated taps, stale responses/events, cancelled tone
analysis, two-dialect sequencing, and GitHub Pages/native base paths.

These are lifecycle regressions, not real-device or audible-speech verification.

## Device checks still required before release

On supported Android Chrome and iOS Safari devices, and the intended Android
WebView build:

1. Online, tap Play and verify audible speech and correct completion state.
2. Tap a different phrase quickly, stop it, then tap again. Confirm only the
   current phrase can play and controls recover.
3. If a verified recording is supplied, map it in `public/lessons.json`, test its
   deployed URL (including `/dragon-bridge` on Pages), then test cached/offline
   playback and both-dialect sequencing.
4. Without that recording, confirm offline/recorded-only attempts honestly show
   unavailable audio and leave Play usable.
5. Exercise a browser autoplay denial and an explicit retry.

No real device, microphone permission, APK install, or native build was used for
the mocked checks above. Ship recordings only after separately verifying their
licence, redistribution terms, provenance, and correct phrase/dialect metadata.
