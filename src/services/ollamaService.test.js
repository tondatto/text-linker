import { afterEach, describe, expect, it, vi } from 'vitest'
import { __ollamaInternals, suggestLinksWithOllama } from './ollamaService.js'

describe('ollama internals', () => {
  it('clampConfidence keeps confidence in [0, 1]', () => {
    expect(__ollamaInternals.clampConfidence(-1)).toBe(0)
    expect(__ollamaInternals.clampConfidence(2)).toBe(1)
    expect(__ollamaInternals.clampConfidence(0.72)).toBe(0.72)
  })

  it('chunkArray splits arrays into fixed-size chunks', () => {
    expect(__ollamaInternals.chunkArray([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]])
  })

  it('parseChatJsonContent handles wrapped JSON payloads', () => {
    const payload = {
      message: {
        content: 'model output before json {"matches":[{"aIndex":0,"bIndex":1,"confidence":0.9}]} trailing text',
      },
    }
    const parsed = __ollamaInternals.parseChatJsonContent(payload)
    expect(parsed).toEqual({ matches: [{ aIndex: 0, bIndex: 1, confidence: 0.9 }] })
  })
})

describe('suggestLinksWithOllama', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('maps valid matches and clamps confidence', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          message: {
            content: JSON.stringify({
              matches: [
                { aIndex: 0, bIndex: 0, confidence: 1.4, reason: 'semantic fit' },
                { aIndex: 99, bIndex: 0, confidence: 0.6 },
              ],
            }),
          },
        }),
      })
    )

    const result = await suggestLinksWithOllama({
      itemsA: ['A1'],
      itemsB: ['B1'],
      model: 'test-model',
    })

    expect(result.error).toBe('')
    expect(result.suggestions).toEqual([
      { from: 'a-0', to: 'b-0', confidence: 1, reason: 'semantic fit' },
    ])
  })

  it('returns input error for invalid collections', async () => {
    const result = await suggestLinksWithOllama({ itemsA: null, itemsB: [] })
    expect(result).toEqual({ suggestions: [], error: 'Invalid items input' })
  })
})
