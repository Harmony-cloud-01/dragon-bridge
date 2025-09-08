#!/usr/bin/env node
// Scan public/audio/<dialect>/**/*.mp3 and append missing rows to scripts/lessons_source.csv
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const audioRoot = path.join(root, 'public', 'audio')
const csvPath = path.join(root, 'scripts', 'lessons_source.csv')

function walk(dir) {
  const out = []
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name)
    if (entry.isDirectory()) out.push(...walk(p))
    else out.push(p)
  }
  return out
}

function loadCsv(pathCsv) {
  if (!fs.existsSync(pathCsv)) return new Set()
  const set = new Set()
  const lines = fs.readFileSync(pathCsv, 'utf8').split(/\r?\n/)
  for (const line of lines) {
    if (!line || line.startsWith('#') || line.startsWith('id,')) continue
    const parts = line.split(',')
    const audio = parts[4]?.trim()
    if (audio) set.add(audio)
  }
  return set
}

function ensureHeader(pathCsv) {
  if (!fs.existsSync(pathCsv)) {
    fs.mkdirSync(path.dirname(pathCsv), { recursive: true })
    fs.writeFileSync(pathCsv, 'id,text,pinyin,dialectCode,audio\n')
  }
}

function main() {
  ensureHeader(csvPath)
  const known = loadCsv(csvPath)
  if (!fs.existsSync(audioRoot)) {
    console.error(`No audio folder at ${audioRoot}`)
    process.exit(0)
  }
  const files = walk(audioRoot).filter((p) => p.endsWith('.mp3'))
  let appended = 0
  const rows = []
  for (const file of files) {
    const rel = path.posix.join('audio', path.relative(path.join(root, 'public', 'audio'), file).split(path.sep).join('/'))
    if (known.has(rel)) continue
    const parts = rel.split('/') // audio/<dialect>/<name>.mp3
    const dialect = parts[1] || ''
    const id = path.basename(rel, '.mp3')
    rows.push(`${id},, ,${dialect},${rel}`)
    appended++
  }
  if (rows.length) fs.appendFileSync(csvPath, rows.join('\n') + '\n')
  console.log(`Scanned ${files.length} files. Appended ${appended} new rows to ${path.relative(root, csvPath)}.`)
}

main()

