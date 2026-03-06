import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import DocumentPanel from './components/DocumentPanel.jsx'
import LinksList from './components/LinksList.jsx'
import TopBar from './components/TopBar.jsx'
import LinkCanvas from './components/LinkCanvas.jsx'
import { initialDataA, initialDataB } from './data/initialData.js'
import { applyFilter, getEndpoint, parseText } from './utils/requirements.js'
import useLinkLayout from './hooks/useLinkLayout.js'

function App() {
  const [dataA, setDataA] = useState(initialDataA)
  const [dataB, setDataB] = useState(initialDataB)
  const [inputA, setInputA] = useState('')
  const [inputB, setInputB] = useState('')
  const [filterA, setFilterA] = useState('')
  const [filterB, setFilterB] = useState('')
  const [links, setLinks] = useState([])
  const [mode, setMode] = useState('single')
  const [selectedA, setSelectedA] = useState(null)
  const [selectedB, setSelectedB] = useState(new Set())
  const [syncScroll, setSyncScroll] = useState(false)
  const [layoutTick, setLayoutTick] = useState(0)
  const [hoveredLink, setHoveredLink] = useState(null)
  const [workspaceStatus, setWorkspaceStatus] = useState('')

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
    if (!workspaceStatus) return
    const timeout = window.setTimeout(() => setWorkspaceStatus(''), 2000)
    return () => window.clearTimeout(timeout)
  }, [workspaceStatus])

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

  const handlePaste = useCallback(async (side) => {
    const text = await navigator.clipboard.readText()
    if (side === 'a') {
      setInputA(text)
      setDataA(parseText(text))
    } else {
      setInputB(text)
      setDataB(parseText(text))
    }
  }, [])

  const saveWorkspace = useCallback(() => {
    const payload = {
      dataA,
      dataB,
      links,
      mode,
      syncScroll,
    }
    window.localStorage.setItem('text-linker-workspace', JSON.stringify(payload))
    setWorkspaceStatus('Workspace saved')
  }, [dataA, dataB, links, mode, syncScroll])

  const loadWorkspace = useCallback(() => {
    const raw = window.localStorage.getItem('text-linker-workspace')
    if (!raw) {
      setWorkspaceStatus('No saved workspace')
      return
    }
    try {
      const payload = JSON.parse(raw)
      setDataA(Array.isArray(payload.dataA) ? payload.dataA : initialDataA)
      setDataB(Array.isArray(payload.dataB) ? payload.dataB : initialDataB)
      setLinks(Array.isArray(payload.links) ? payload.links : [])
      setMode(payload.mode === 'multi' ? 'multi' : 'single')
      setSyncScroll(Boolean(payload.syncScroll))
      resetSelection()
      scheduleLayout()
      setWorkspaceStatus('Workspace loaded')
    } catch {
      setWorkspaceStatus('Invalid workspace data')
    }
  }, [resetSelection, scheduleLayout])

  const handleUpload = useCallback(async (side, event) => {
    const file = event.target.files?.[0]
    if (!file) return
    const text = await file.text()
    if (side === 'a') {
      setInputA(text)
      setDataA(parseText(text))
    } else {
      setInputB(text)
      setDataB(parseText(text))
    }
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
    if (syncScroll && listARef.current && listBRef.current && !syncingRef.current) {
      syncingRef.current = true
      listBRef.current.scrollTop = listARef.current.scrollTop
      syncingRef.current = false
    }
    scheduleLayout()
  }, [scheduleLayout, syncScroll])

  const handleScrollB = useCallback(() => {
    if (syncScroll && listARef.current && listBRef.current && !syncingRef.current) {
      syncingRef.current = true
      listARef.current.scrollTop = listBRef.current.scrollTop
      syncingRef.current = false
    }
    scheduleLayout()
  }, [scheduleLayout, syncScroll])

  const deleteLink = useCallback(
    (index) => {
      setLinks((prev) => prev.filter((_, idx) => idx !== index))
      setHoveredLink(null)
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

  const handleCanvasHover = useCallback((path) => {
    setHoveredLink({
      index: path.index,
      x: (path.fromPoint.x + path.toPoint.x) / 2,
      y: (path.fromPoint.y + path.toPoint.y) / 2,
    })
  }, [])

  const handleCanvasLeave = useCallback((event) => {
    if (event?.relatedTarget?.id === 'delete-link') return
    setHoveredLink(null)
  }, [])

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <TopBar
        mode={mode}
        linksCount={links.length}
        onClear={() => setLinks([])}
        onCopy={copyLinks}
        onSave={saveWorkspace}
        onLoad={loadWorkspace}
        onModeChange={handleModeChange}
        onLinkSelected={linkSelected}
        syncScroll={syncScroll}
        onSyncScrollChange={setSyncScroll}
        status={workspaceStatus}
      />

      <div className="grid grid-cols-[minmax(0,1fr)_60px_minmax(0,1fr)] items-start gap-4 px-8 pb-8">
        <DocumentPanel
          title="Document A"
          inputValue={inputA}
          onInputChange={setInputA}
          onLoad={() => setDataA(parseText(inputA))}
          onPaste={() => handlePaste('a')}
          onUpload={(event) => handleUpload('a', event)}
          filterValue={filterA}
          onFilterChange={setFilterA}
          items={filteredA}
          listRef={listARef}
          onItemDragStart={handleDragStart}
          onItemDrop={handleDrop}
          onItemClick={handleItemClick}
          onScroll={handleScrollA}
          isSelected={isSelected}
          side="a"
        />

        <LinkCanvas
          linkPaths={linkPaths}
          hoveredLink={hoveredLink}
          onHover={handleCanvasHover}
          onLeave={handleCanvasLeave}
          onDelete={deleteLink}
          canvasRef={canvasRef}
        />

        <DocumentPanel
          title="Document B"
          inputValue={inputB}
          onInputChange={setInputB}
          onLoad={() => setDataB(parseText(inputB))}
          onPaste={() => handlePaste('b')}
          onUpload={(event) => handleUpload('b', event)}
          filterValue={filterB}
          onFilterChange={setFilterB}
          items={filteredB}
          listRef={listBRef}
          onItemDragStart={handleDragStart}
          onItemDrop={handleDrop}
          onItemClick={handleItemClick}
          onScroll={handleScrollB}
          isSelected={isSelected}
          side="b"
        />
      </div>

      <div className="px-8 pb-10">
        <LinksList links={visibleLinks} onDelete={deleteLink} />
      </div>
    </div>
  )
}

export default App
