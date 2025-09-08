#!/usr/bin/env node
// Inject RECORD_AUDIO permission into AndroidManifest.xml (Capacitor Android)
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const manifestPath = path.join(root, 'android', 'app', 'src', 'main', 'AndroidManifest.xml')

if (!fs.existsSync(manifestPath)) {
  console.error(`AndroidManifest not found at: ${manifestPath}\nRun 'pnpm run cap:add:android' first.`)
  process.exit(0)
}

let xml = fs.readFileSync(manifestPath, 'utf8')

const permLine = '<uses-permission android:name="android.permission.RECORD_AUDIO" />'
if (xml.includes('android.permission.RECORD_AUDIO')) {
  console.log('RECORD_AUDIO permission already present')
  process.exit(0)
}

// Insert permission before <application ...>
const appIdx = xml.indexOf('<application')
if (appIdx === -1) {
  console.error('Could not find <application> tag; aborting.')
  process.exit(1)
}

const head = xml.slice(0, appIdx)
const tail = xml.slice(appIdx)
const injection = `  ${permLine}\n`
const updated = head + injection + tail

fs.writeFileSync(manifestPath, updated, 'utf8')
console.log('Injected RECORD_AUDIO permission into AndroidManifest.xml')

