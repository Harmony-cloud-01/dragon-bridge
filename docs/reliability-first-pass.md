# Reliability first pass: issues #5–#7

Base: `4789f5e4a1e188956fa899db9220b4a2ee29eba9`.

This is a bounded repair, not Android release certification. No backend, paid AI,
new recording assets, SDK installation, or live microphone access is involved.

## Persistence

- Browser storage no longer initializes SQLite. Native storage uses the SQLite
  plugin, publishes a connection only after schema initialization, and closes a
  failed connection before retrying.
- Failed factory/open/schema initialization resets the cached request. A later
  operation can retry. Native failures deliberately do **not** switch to an empty
  localStorage store, which could hide an existing database. No destructive recovery is attempted.
- Native startup imports legacy local SRS/activity by profile before exposing
  SQLite. It keeps the original bytes, adds only missing records, preserves native
  SRS on conflicts, and can retry partial imports without duplicate events.
  A completion marker prevents later-deleted progress being resurrected on restart.
  Malformed legacy data blocks startup with a warning rather than disappearing.
- Local storage errors reject; callers display actionable warnings. Malformed
  local SRS/list containers are preserved rather than overwritten as empty data.
- SRS mutations are serialized within this app window and committed before the
  displayed list changes. Failed saves do not emit success activity or a success
  toast. Late reads cannot replace a newly selected profile's SRS list.
- Activity and progress read from the same selected engine used by writes.
  Profile IDs are captured before asynchronous activity and SRS operations.
- Review buttons reject duplicate submissions while saving and advance without
  skipping the next due card.
- Profile backup/restore uses the selected progress engine, validates supported
  backup fields before writing, and reports partial-import failures honestly.
  Preferences remain in their existing local store; the v2 backup format is kept.
- Anonymous SQLite activity/SRS operations are scoped rather than reading or
  deleting every profile. Profile-list replacement uses one SQL transaction.

Existing profile-management cache/mirroring and preference hydration are not
redesigned here. Native restart/migration scenarios still need device testing;
this pass does not claim issue #5's full Android completion criteria. Serialization
is within one window, not a cross-tab or multi-process transaction protocol.

## Playback and microphone

See [audio-playback.md](audio-playback.md) for the actual recording limitation,
mock-tested behavior, and outstanding platform matrix.

Microphone capture has one lifecycle owner. Stop/cancel, unmount, consent
revocation, profile changes and setup errors release tracks, audio nodes/context,
and drawing callbacks. Late permission grants are stopped immediately. Concurrent
Start actions cannot create overlapping streams. Consent is refreshed and explicit
session revocation wins over stale background reads.

## Reproduce checks

Use Node 24 for the regression suite, with the existing project dependencies
installed. No new test runner dependency is added.

```sh
npm test
npm run typecheck
npm run build
```

The tests use mocked React hooks, the Capacitor bridge, localStorage, speech
synthesis, audio and microphone APIs. A separate file-backed SQLite test exercises
the actual schema, queries, restart round-trip and failed-transaction rollback. They never activate a device microphone. They cover actual
component/hook wiring as well as the lifecycle helpers. They do not replace a
real browser/Android test.

The existing `lint` script opens Next's interactive ESLint setup because this
repository has no ESLint configuration. A standalone lint pass has therefore
not been established; no unsolicited lint dependency/configuration was added.

## Release gates

1. Test profiles, SRS, activity and progress across a real Android app restart.
   Exercise native plugin failure and retry without changing data stores.
2. Test blocked/quota-limited storage in browser UI and verify warnings and retry.
3. Verify real Android/mobile audible playback, repeated taps/Stop, and Pages
   subpath/native asset behavior. The recording catalogue is currently empty.
4. With separately authorized microphone access, verify the device privacy
   indicator clears on Stop, navigation, revocation and profile switch, including
   a permission prompt granted after cancellation.
5. Reconcile existing PR #2/#3 and run remote CI only after publication approval.
   No issue should be closed merely on the strength of mocked lifecycle tests.
