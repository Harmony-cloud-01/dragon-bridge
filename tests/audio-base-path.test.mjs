import test from 'node:test'
import assert from 'node:assert/strict'
import { getBasePath, withBasePath } from '../lib/base-path.ts'

function withWindow(value, fn) {
  const previous = globalThis.window
  globalThis.window = value
  try { fn() } finally {
    if (previous === undefined) delete globalThis.window
    else globalThis.window = previous
  }
}

test('audio paths retain the GitHub Pages prefix in a Capacitor web runtime', () => {
  withWindow({
    location: { hostname: 'harmony-cloud-01.github.io', pathname: '/dragon-bridge/' },
    Capacitor: { isNativePlatform: () => false },
  }, () => {
    assert.equal(getBasePath(), '/dragon-bridge')
    assert.equal(withBasePath('/audio/zh-CN/hello.mp3'), '/dragon-bridge/audio/zh-CN/hello.mp3')
  })
})

test('native audio paths omit the web prefix and keep a leading slash', () => {
  withWindow({ Capacitor: { isNativePlatform: () => true } }, () => {
    assert.equal(withBasePath('audio/zh-CN/hello.mp3'), '/audio/zh-CN/hello.mp3')
  })
})

test('base path matching respects path-segment boundaries without double-prefixing', () => {
  withWindow({ location: { hostname: 'example.github.io', pathname: '/dragon-bridge/' } }, () => {
    assert.equal(withBasePath('/dragon-bridge/audio/hello.mp3'), '/dragon-bridge/audio/hello.mp3')
    assert.equal(withBasePath('/dragon-bridge-extra/audio/hello.mp3'), '/dragon-bridge/dragon-bridge-extra/audio/hello.mp3')
  })
})
