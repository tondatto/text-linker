import { describe, expect, it } from 'vitest'
import { applyFilter, parseText } from './textUtils.js'

describe('textUtils', () => {
  it('parseText trims lines and removes blanks', () => {
    const input = '  Item A\n\n Item B  \n   \nItem C '
    expect(parseText(input)).toEqual(['Item A', 'Item B', 'Item C'])
  })

  it('applyFilter returns items with original indices', () => {
    const items = ['Alpha requirement', 'Beta story', 'Gamma requirement']
    expect(applyFilter(items, 'requirement')).toEqual([
      { text: 'Alpha requirement', originalIndex: 0 },
      { text: 'Gamma requirement', originalIndex: 2 },
    ])
  })
})
