import { useCallback, useEffect, useRef, useState } from 'react'
import {
  AUTO_LINK_CONFIDENCE_THRESHOLD,
  OLLAMA_DEFAULT_MODEL,
  suggestLinksWithOllama,
} from '../services/ollamaService.js'

const useLinkSuggestions = ({ dataA, dataB, setLinks, scheduleLayout, setWorkspaceStatus }) => {
  const [suggestionLoading, setSuggestionLoading] = useState(false)
  const [suggestionError, setSuggestionError] = useState('')
  const [lastSuggestionRunAt, setLastSuggestionRunAt] = useState(null)
  const suggestionAbortRef = useRef(null)

  useEffect(
    () => () => {
      suggestionAbortRef.current?.abort()
    },
    []
  )

  const handleSuggestLinks = useCallback(async () => {
    if (suggestionLoading) return
    if (dataA.length === 0 || dataB.length === 0) {
      setWorkspaceStatus('Add content to both documents first')
      return
    }

    suggestionAbortRef.current?.abort()
    const controller = new AbortController()
    suggestionAbortRef.current = controller
    setSuggestionLoading(true)
    setSuggestionError('')

    const startedAt = performance.now()

    try {
      const result = await suggestLinksWithOllama({
        itemsA: dataA,
        itemsB: dataB,
        model: OLLAMA_DEFAULT_MODEL,
        signal: controller.signal,
      })

      const suggestions = result.suggestions ?? []
      const acceptedSuggestions = suggestions.filter(
        (suggestion) => suggestion.confidence >= AUTO_LINK_CONFIDENCE_THRESHOLD
      )

      let addedCount = 0
      let duplicateCount = 0

      setLinks((prev) => {
        const seen = new Set(prev.map((link) => `${link.from}->${link.to}`))
        const next = [...prev]

        acceptedSuggestions.forEach((suggestion) => {
          const fromSide = suggestion.from.split('-')[0]
          const toSide = suggestion.to.split('-')[0]
          if (fromSide === toSide) return

          const key = `${suggestion.from}->${suggestion.to}`
          if (seen.has(key)) {
            duplicateCount += 1
            return
          }
          seen.add(key)
          next.push({ from: suggestion.from, to: suggestion.to })
          addedCount += 1
        })

        return next
      })

      setLastSuggestionRunAt(Date.now())
      scheduleLayout()
      setWorkspaceStatus(
        `Suggestions: ${suggestions.length} total, ${addedCount} added, ${duplicateCount} duplicates skipped`
      )

      if (import.meta.env.DEV) {
        const durationMs = Math.round(performance.now() - startedAt)
        console.debug('Ollama suggestion run complete', {
          durationMs,
          totalSuggestions: suggestions.length,
          acceptedSuggestions: acceptedSuggestions.length,
          addedCount,
          duplicateCount,
          model: OLLAMA_DEFAULT_MODEL,
        })
      }
    } catch (error) {
      if (controller.signal.aborted) {
        setWorkspaceStatus('Suggestion run cancelled')
        return
      }
      const message = error instanceof Error ? error.message : 'Failed to suggest links'
      setSuggestionError(message)
      setWorkspaceStatus(`Suggestion failed: ${message}`)
    } finally {
      if (suggestionAbortRef.current === controller) {
        suggestionAbortRef.current = null
      }
      setSuggestionLoading(false)
    }
  }, [dataA, dataB, scheduleLayout, setLinks, setWorkspaceStatus, suggestionLoading])

  return {
    handleSuggestLinks,
    suggestionError,
    suggestionLoading,
    lastSuggestionRunAt,
  }
}

export default useLinkSuggestions
