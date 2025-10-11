import { describe, expect, it } from '@jest/globals'

import { cn } from './utils'

describe('cn', () => {
  it('merges Tailwind classes and removes conflicts', () => {
    expect(cn('p-2', 'p-4', 'text-sm', undefined)).toBe('p-4 text-sm')
  })

  it('supports conditional values', () => {
    const condition = true
    expect(cn('p-2', condition && 'text-lg')).toBe('p-2 text-lg')
  })
})
