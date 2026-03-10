import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import DocumentPanel from './components/DocumentPanel.jsx'
import LinksList from './components/LinksList.jsx'
import TopBar from './components/TopBar.jsx'
import LinkCanvas from './components/LinkCanvas.jsx'
import { initialDataA, initialDataB } from './data/initialData.js'
import { applyFilter, getEndpoint, parseText } from './utils/requirements.js'
import useLinkLayout from './hooks/useLinkLayout.js'
import useWorkspacePersistence from './hooks/useWorkspacePersistence.js'
import useLinkSuggestions from './hooks/useLinkSuggestions.js'

function App() {
  const [dataA, setDataA] = useState(initialDataA)
  const [dataB, setDataB] = useState(initialDataB)
  const [filterA, setFilterA] = useState('')
  const [filterB, setFilterB] = useState('')
  const [links, setLinks] = useState([])
  const [mode, setMode] = useState('single')
  const [selectedA, setSelectedA] = useState(null)
  const [selectedB, setSelectedB] = useState(new Set())
  const [syncScroll, setSyncScroll] = useState(false)
  const [fullScroll, setFullScroll] = useState(false)
  const [layoutTick, setLayoutTick] = useState(0)
  const [selectedLinkIndex, setSelectedLinkIndex] = useState(null)
  const [workspaceStatus, setWorkspaceStatus] = useState('')
  const [activeEditorDoc, setActiveEditorDoc] = useState(null)
  const [editorText, setEditorText] = useState('')

  const listARef = useRef(null)
  const listBRef = useRef(null)
  const canvasRef = useRef(null)
  const rafRef = useRef(null)
  const syncingRef = useRef(false)

  const filteredA = useMemo(() => applyFilter(dataA, filterA), [dataA, filterA])
  const filteredB = useMemo(() => applyFilter(dataB, filterB), [dataB, filterB])

  const scheduleLayout = useCallback(() => {
    if (rafRef.current) return
    rafRef.current = requestAnimationFrame(() => {
      setLayoutTick((tick) => tick + 1)
      rafRef.current = null
    })
  }, [])

  useEffect(() => {
    const handleResize = () => scheduleLayout()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [scheduleLayout])

  useEffect(() => {
    scheduleLayout()
  }, [filteredA, filteredB, scheduleLayout])

  useEffect(() => {
    scheduleLayout()
  }, [selectedA, selectedB, scheduleLayout])

  useEffect(() => {
    scheduleLayout()
  }, [fullScroll, scheduleLayout])

  useEffect(() => {
    if (!workspaceStatus) return
    const timeout = window.setTimeout(() => setWorkspaceStatus(''), 2000)
    return () => window.clearTimeout(timeout)
  }, [workspaceStatus])

  useEffect(() => {
    if (!activeEditorDoc) return undefined
    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        setActiveEditorDoc(null)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [activeEditorDoc])

  const resetSelection = useCallback(() => {
    setSelectedA(null)
    setSelectedB(new Set())
  }, [])

  const isSelected = useCallback(
    (id) => {
      if (!id) return false
      const side = id.split('-')[0]
      if (side === 'a') return selectedA === id
      return selectedB.has(id)
    },
    [selectedA, selectedB]
  )

  const addLink = useCallback(
    (fromId, toId) => {
      if (fromId.split('-')[0] === toId.split('-')[0]) return
      setLinks((prev) => {
        if (prev.some((link) => link.from === fromId && link.to === toId)) return prev
        return [...prev, { from: fromId, to: toId }]
      })
      scheduleLayout()
    },
    [scheduleLayout]
  )

  const handleItemClick = useCallback(
    (id) => {
      const side = id.split('-')[0]
      if (mode === 'single') {
        if (side === 'a') {
          setSelectedA((prev) => (prev === id ? null : id))
        } else if (selectedA) {
          addLink(selectedA, id)
        }
        scheduleLayout()
        return
      }
      if (side === 'a') {
        setSelectedA((prev) => (prev === id ? null : id))
        scheduleLayout()
        return
      }
      setSelectedB((prev) => {
        const next = new Set(prev)
        if (next.has(id)) {
          next.delete(id)
        } else {
          next.add(id)
        }
        return next
      })
      scheduleLayout()
    },
    [addLink, mode, scheduleLayout, selectedA]
  )

  const linkSelected = useCallback(() => {
    if (!selectedA || selectedB.size === 0) return
    selectedB.forEach((id) => addLink(selectedA, id))
    resetSelection()
    scheduleLayout()
  }, [addLink, resetSelection, scheduleLayout, selectedA, selectedB])

  const shouldRenderLink = useCallback(
    (link) => {
      const fromSide = link.from.split('-')[0]
      const toSide = link.to.split('-')[0]
      const fromIndex = Number(link.from.split('-')[1])
      const toIndex = Number(link.to.split('-')[1])
      const fromText = fromSide === 'a' ? dataA[fromIndex] : dataB[fromIndex]
      const toText = toSide === 'a' ? dataA[toIndex] : dataB[toIndex]
      if (!fromText || !toText) return false
      const filterTextA = filterA.trim().toLowerCase()
      const filterTextB = filterB.trim().toLowerCase()
      const fromMatchesA = !filterTextA || (fromSide === 'a' && fromText.toLowerCase().includes(filterTextA))
      const toMatchesA = !filterTextA || (toSide === 'a' && toText.toLowerCase().includes(filterTextA))
      const fromMatchesB = !filterTextB || (fromSide === 'b' && fromText.toLowerCase().includes(filterTextB))
      const toMatchesB = !filterTextB || (toSide === 'b' && toText.toLowerCase().includes(filterTextB))
      return (fromMatchesA || toMatchesA) && (fromMatchesB || toMatchesB)
    },
    [dataA, dataB, filterA, filterB]
  )

  const linkPaths = useLinkLayout({
    links,
    listARef,
    listBRef,
    canvasRef,
    getEndpoint,
    shouldRenderLink,
    layoutTick,
  })

  const visibleLinks = useMemo(() => links.filter(shouldRenderLink), [links, shouldRenderLink])

  const linkedIds = useMemo(() => {
    const ids = new Set()
    links.forEach((link) => {
      ids.add(link.from)
      ids.add(link.to)
    })
    return ids
  }, [links])

  const openEditor = useCallback((side) => {
    const currentText = side === 'a' ? dataA.join('\n') : dataB.join('\n')
    setEditorText(currentText)
    setActiveEditorDoc(side)
  }, [dataA, dataB])

  const closeEditor = useCallback(() => {
    setActiveEditorDoc(null)
  }, [])

  const submitEditorText = useCallback(() => {
    if (!activeEditorDoc) return
    const parsed = parseText(editorText)
    if (activeEditorDoc === 'a') {
      setDataA(parsed)
    } else {
      setDataB(parsed)
    }
    setActiveEditorDoc(null)
    scheduleLayout()
  }, [activeEditorDoc, editorText, scheduleLayout])

  const pasteIntoEditor = useCallback(async () => {
    try {
      const text = await navigator.clipboard.readText()
      setEditorText(text)
    } catch {
      setWorkspaceStatus('Clipboard access denied')
    }
  }, [])

  const { saveWorkspace, loadWorkspace } = useWorkspacePersistence({
    dataA,
    dataB,
    links,
    mode,
    syncScroll,
    fullScroll,
    setDataA,
    setDataB,
    setLinks,
    setMode,
    setSyncScroll,
    setFullScroll,
    setWorkspaceStatus,
    resetSelection,
    scheduleLayout,
    initialDataA,
    initialDataB,
  })

  const uploadIntoEditor = useCallback(async (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    const text = await file.text()
    setEditorText(text)
    event.target.value = ''
  }, [])

  const handleDragStart = useCallback(
    (event, id) => {
      event.dataTransfer.setData('text/plain', id)
      scheduleLayout()
    },
    [scheduleLayout]
  )

  const handleDrop = useCallback(
    (event, id) => {
      event.preventDefault()
      const sourceId = event.dataTransfer.getData('text/plain')
      if (!sourceId) return
      addLink(sourceId, id)
      scheduleLayout()
    },
    [addLink, scheduleLayout]
  )

  const handleScrollA = useCallback(() => {
    if (fullScroll) return
    if (syncScroll && listARef.current && listBRef.current && !syncingRef.current) {
      syncingRef.current = true
      listBRef.current.scrollTop = listARef.current.scrollTop
      syncingRef.current = false
    }
    scheduleLayout()
  }, [fullScroll, scheduleLayout, syncScroll])

  const handleScrollB = useCallback(() => {
    if (fullScroll) return
    if (syncScroll && listARef.current && listBRef.current && !syncingRef.current) {
      syncingRef.current = true
      listARef.current.scrollTop = listBRef.current.scrollTop
      syncingRef.current = false
    }
    scheduleLayout()
  }, [fullScroll, scheduleLayout, syncScroll])

  const deleteLink = useCallback(
    (index) => {
      setLinks((prev) => prev.filter((_, idx) => idx !== index))
      setSelectedLinkIndex(null)
      scheduleLayout()
    },
    [scheduleLayout]
  )

  const copyLinks = useCallback(async () => {
    const payload = links.map((link) => {
      const fromSide = link.from.split('-')[0]
      const toSide = link.to.split('-')[0]
      const fromIndex = Number(link.from.split('-')[1])
      const toIndex = Number(link.to.split('-')[1])
      const fromText = fromSide === 'a' ? dataA[fromIndex] : dataB[fromIndex]
      const toText = toSide === 'a' ? dataA[toIndex] : dataB[toIndex]
      return { from: link.from, to: link.to, fromText, toText }
    })
    await navigator.clipboard.writeText(JSON.stringify(payload, null, 2))
  }, [dataA, dataB, links])

  const handleModeChange = useCallback(
    (nextMode) => {
      setMode(nextMode)
      resetSelection()
      scheduleLayout()
    },
    [resetSelection, scheduleLayout]
  )

  const handleCanvasSelect = useCallback((path) => {
    if (!path) {
      setSelectedLinkIndex(null)
      return
    }
    setSelectedLinkIndex(path.index)
  }, [])

  const {
    handleSuggestLinks,
    suggestionError,
    suggestionLoading,
    lastSuggestionRunAt,
  } = useLinkSuggestions({
    dataA,
    dataB,
    setLinks,
    scheduleLayout,
    setWorkspaceStatus,
  })

  const workspaceActions = useMemo(
    () => ({
      onSave: saveWorkspace,
      onLoad: loadWorkspace,
    }),
    [loadWorkspace, saveWorkspace]
  )

  const documentActions = useMemo(
    () => ({
      onLoadA: () => openEditor('a'),
      onLoadB: () => openEditor('b'),
    }),
    [openEditor]
  )

  const linkActions = useMemo(
    () => ({
      onClear: () => setLinks([]),
      onCopy: copyLinks,
      onModeChange: handleModeChange,
      onLinkSelected: linkSelected,
    }),
    [copyLinks, handleModeChange, linkSelected]
  )

  const suggestionActions = useMemo(
    () => ({
      onSuggestLinks: handleSuggestLinks,
      loading: suggestionLoading,
    }),
    [handleSuggestLinks, suggestionLoading]
  )

  const viewActions = useMemo(
    () => ({
      syncScroll,
      onSyncScrollChange: setSyncScroll,
      fullScroll,
      onFullScrollChange: setFullScroll,
    }),
    [fullScroll, syncScroll]
  )

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <TopBar
        mode={mode}
        linksCount={links.length}
        workspaceActions={workspaceActions}
        documentActions={documentActions}
        linkActions={linkActions}
        suggestionActions={suggestionActions}
        viewActions={viewActions}
        status={workspaceStatus || suggestionError || (lastSuggestionRunAt ? `Last suggestion run: ${new Date(lastSuggestionRunAt).toLocaleTimeString()}` : '')}
      />

      <div className="grid grid-cols-[minmax(0,1fr)_60px_minmax(0,1fr)] items-start gap-4 px-8 pb-8 pt-20">
        <DocumentPanel
          title="Document A"
          filterValue={filterA}
          onFilterChange={setFilterA}
          items={filteredA}
          listRef={listARef}
          onItemDragStart={handleDragStart}
          onItemDrop={handleDrop}
          onItemClick={handleItemClick}
          onScroll={handleScrollA}
          isSelected={isSelected}
          hasLink={(id) => linkedIds.has(id)}
          side="a"
          fullScroll={fullScroll}
        />

        <LinkCanvas
          linkPaths={linkPaths}
          selectedIndex={selectedLinkIndex}
          onSelect={handleCanvasSelect}
          onDelete={deleteLink}
          canvasRef={canvasRef}
        />

        <DocumentPanel
          title="Document B"
          filterValue={filterB}
          onFilterChange={setFilterB}
          items={filteredB}
          listRef={listBRef}
          onItemDragStart={handleDragStart}
          onItemDrop={handleDrop}
          onItemClick={handleItemClick}
          onScroll={handleScrollB}
          isSelected={isSelected}
          hasLink={(id) => linkedIds.has(id)}
          side="b"
          fullScroll={fullScroll}
        />
      </div>

      <div className="px-8 pb-10">
        <LinksList links={visibleLinks} onDelete={deleteLink} />
      </div>

      {activeEditorDoc ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/45 p-4" onClick={closeEditor}>
          <div
            className="w-full max-w-3xl rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl shadow-slate-900/30"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 className="text-sm font-semibold text-slate-900">
              {activeEditorDoc === 'a' ? 'Document A editor' : 'Document B editor'}
            </h2>
            <p className="mt-1 text-xs text-slate-500">Paste text with one requirement per line, then load it.</p>
            <textarea
              className="mt-3 h-64 w-full rounded-xl border border-slate-200 p-3 text-sm"
              value={editorText}
              onChange={(event) => setEditorText(event.target.value)}
              placeholder="Paste document text here"
            />
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <button
                className="rounded-full border border-blue-600 bg-blue-600 px-3 py-1.5 text-xs text-white"
                type="button"
                onClick={submitEditorText}
              >
                Load document
              </button>
              <button
                className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700"
                type="button"
                onClick={pasteIntoEditor}
              >
                Paste from clipboard
              </button>
              <label className="cursor-pointer rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700">
                Upload file
                <input className="hidden" type="file" accept=".txt" onChange={uploadIntoEditor} />
              </label>
              <button
                className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700"
                type="button"
                onClick={closeEditor}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

export default App
