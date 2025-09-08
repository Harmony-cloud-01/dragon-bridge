#!/usr/bin/env node
// Generate public/lessons.json from scripts/lessons_source.csv
// Columns: id,text,pinyin,dialectCode,audio
// Audio path is relative to public/audio/<dialectCode>/

import fs from 'node:fs'
import path from 'node:path'
import readline from 'node:readline'

const repoRoot = path.resolve(process.cwd())
const srcCsv = path.join(repoRoot, 'scripts', 'lessons_source.csv')
const outJson = path.join(repoRoot, 'public', 'lessons.json')

function parseCsvLine(line) {
  // basic CSV parser: split by comma, ignore lines starting with '#'
  // does not support embedded commas inside quotes. Keep sources simple.
  if (!line || line.trim().startsWith('#')) return null
  // naive split
  const parts = line.split(',').map((s) => s.trim())
  if (parts.length < 5) return null
  return {
    id: parts[0],
    text: parts[1],
    pinyin: parts[2],
    dialectCode: parts[3],
    audio: parts[4],
  }
}

async function main() {
  if (!fs.existsSync(srcCsv)) {
    console.error(`Source CSV not found: ${srcCsv}`)
    process.exit(1)
  }

  const rl = readline.createInterface({
    input: fs.createReadStream(srcCsv, 'utf8'),
    crlfDelay: Infinity,
  })

  const lessons = []
  let headerRead = false
  for await (const raw of rl) {
    const line = raw.trim()
    if (!line) continue
    if (!headerRead) { headerRead = true; continue } // skip header
    const row = parseCsvLine(line)
    if (!row) continue
    const audioRel = row.audio?.replace(/^\/+/, '') || ''
    const audioPath = path.posix.join('audio', row.dialectCode, audioRel)
    const abs = path.join(repoRoot, 'public', audioPath)
    if (!fs.existsSync(abs)) {
      console.warn(`WARN: audio file not found: ${audioPath}`)
    }
    lessons.push({
      id: row.id,
      text: row.text,
      pinyin: row.pinyin,
      dialectCode: row.dialectCode,
      audio: audioPath,
    })
  }

  fs.writeFileSync(outJson, JSON.stringify(lessons, null, 2))
  console.log(`Wrote ${lessons.length} lessons to ${path.relative(repoRoot, outJson)}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})

