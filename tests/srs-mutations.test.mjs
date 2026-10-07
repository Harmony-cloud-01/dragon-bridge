import test from 'node:test'
import assert from 'node:assert/strict'
import { load } from './load-module.mjs'

test('SRS changes serialize so parallel updates read the last committed value', async () => {
  const { queueSrsMutation } = await load('storage/srs-mutations.ts')
  let value = 0
  const increment = () => queueSrsMutation(async () => {
    const prior = value
    await new Promise(resolve => setTimeout(resolve, 5))
    value = prior + 1
  })
  await Promise.all([increment(), increment(), increment()])
  assert.equal(value, 3)
})

test('failed SRS save rejects and does not poison later retries', async () => {
  const { queueSrsMutation } = await load('storage/srs-mutations.ts')
  await assert.rejects(queueSrsMutation(async () => { throw Error('quota') }), /quota/)
  assert.equal(await queueSrsMutation(async () => 'saved'), 'saved')
})
