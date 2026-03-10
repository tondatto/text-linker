const OLLAMA_API_PATH = '/api/ollama/api/chat'
const OLLAMA_SYSTEM_PROMPT =
  'You match requirement items between document A and document B. Return JSON only with this exact shape: {"matches":[{"aIndex":0,"bIndex":0,"confidence":0.0,"reason":"short reason"}]}. Confidence is between 0 and 1. Only include good semantic matches. No markdown.'
const OLLAMA_TIMEOUT_MS = 30000
const OLLAMA_BATCH_SIZE = 24
const OLLAMA_MAX_ITEM_LENGTH = 260
const OLLAMA_TEMPERATURE = 0

export const OLLAMA_DEFAULT_MODEL = 'qwen2.5-coder:7b'
export const AUTO_LINK_CONFIDENCE_THRESHOLD = 0.85

const clampConfidence = (value) => {
  const numeric = Number(value)
  if (Number.isNaN(numeric)) return 0
  if (numeric < 0) return 0
  if (numeric > 1) return 1
  return numeric
}

const chunkArray = (arr, size) => {
  const chunks = []
  for (let index = 0; index < arr.length; index += size) {
    chunks.push(arr.slice(index, index + size))
  }
  return chunks
}

const truncateItem = (text) => {
  if (text.length <= OLLAMA_MAX_ITEM_LENGTH) return text
  return `${text.slice(0, OLLAMA_MAX_ITEM_LENGTH - 3)}...`
}

const buildUserPrompt = (itemsA, itemsB) => {
  const formattedA = itemsA.map((item) => ({ index: item.index, text: truncateItem(item.text) }))
  const formattedB = itemsB.map((item) => ({ index: item.index, text: truncateItem(item.text) }))
  return JSON.stringify({
    instruction: 'Match semantically related items from A to B. Return only JSON object.',
    documentA: formattedA,
    documentB: formattedB,
  })
}

const parseChatJsonContent = (payload) => {
  const content = payload?.message?.content
  if (typeof content === 'object' && content) return content
  if (typeof content !== 'string') return null

  try {
    return JSON.parse(content)
  } catch {
    const maybeJson = content.match(/\{[\s\S]*\}/)
    if (!maybeJson) return null
    try {
      return JSON.parse(maybeJson[0])
    } catch {
      return null
    }
  }
}

const fetchWithTimeout = async (url, options, timeoutMs) => {
  const controller = new AbortController()
  const timeoutId = globalThis.setTimeout(() => controller.abort(), timeoutMs)

  const onAbort = () => controller.abort()
  options.signal?.addEventListener('abort', onAbort)

  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal,
    })
  } finally {
    globalThis.clearTimeout(timeoutId)
    options.signal?.removeEventListener('abort', onAbort)
  }
}

const callOllamaBatch = async ({ model, itemsA, itemsB, signal }) => {
  const response = await fetchWithTimeout(
    OLLAMA_API_PATH,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        stream: false,
        format: 'json',
        options: { temperature: OLLAMA_TEMPERATURE },
        messages: [
          { role: 'system', content: OLLAMA_SYSTEM_PROMPT },
          { role: 'user', content: buildUserPrompt(itemsA, itemsB) },
        ],
      }),
      signal,
    },
    OLLAMA_TIMEOUT_MS
  )

  if (!response.ok) {
    throw new Error(`Ollama request failed (${response.status})`)
  }

  const payload = await response.json()
  const parsed = parseChatJsonContent(payload)
  if (!parsed || !Array.isArray(parsed.matches)) return []

  return parsed.matches
    .map((match) => {
      const aIndex = Number(match?.aIndex)
      const bIndex = Number(match?.bIndex)
      if (!Number.isInteger(aIndex) || !Number.isInteger(bIndex)) return null
      if (!itemsA.some((item) => item.index === aIndex)) return null
      if (!itemsB.some((item) => item.index === bIndex)) return null
      return {
        from: `a-${aIndex}`,
        to: `b-${bIndex}`,
        confidence: clampConfidence(match?.confidence),
        reason: typeof match?.reason === 'string' ? match.reason : '',
      }
    })
    .filter(Boolean)
}

export const suggestLinksWithOllama = async ({ itemsA, itemsB, model = OLLAMA_DEFAULT_MODEL, signal }) => {
  if (!Array.isArray(itemsA) || !Array.isArray(itemsB)) {
    return { suggestions: [], error: 'Invalid items input' }
  }
  if (itemsA.length === 0 || itemsB.length === 0) {
    return { suggestions: [], error: '' }
  }

  const indexedA = itemsA.map((text, index) => ({ text, index }))
  const indexedB = itemsB.map((text, index) => ({ text, index }))

  const chunksA = chunkArray(indexedA, OLLAMA_BATCH_SIZE)
  const chunksB = chunkArray(indexedB, OLLAMA_BATCH_SIZE)
  const merged = new Map()

  for (const chunkA of chunksA) {
    for (const chunkB of chunksB) {
      if (signal?.aborted) {
        throw new Error('Suggestion run cancelled')
      }

      try {
        const batchMatches = await callOllamaBatch({ model, itemsA: chunkA, itemsB: chunkB, signal })
        batchMatches.forEach((match) => {
          const key = `${match.from}->${match.to}`
          const prev = merged.get(key)
          if (!prev || match.confidence > prev.confidence) {
            merged.set(key, match)
          }
        })
      } catch (error) {
        if (signal?.aborted) throw error
        if (import.meta.env.DEV) {
          console.debug('Ollama batch failed', {
            error: error instanceof Error ? error.message : String(error),
            aSize: chunkA.length,
            bSize: chunkB.length,
          })
        }
      }
    }
  }

  return { suggestions: [...merged.values()], error: '' }
}

export const __ollamaInternals = {
  buildUserPrompt,
  clampConfidence,
  chunkArray,
  parseChatJsonContent,
}
