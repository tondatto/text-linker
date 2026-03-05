import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'

const initialDataA = [
  'Allow registering works or services tied to a contract, with details.',
  'Allow location info with road, segment, and coordinates.',
  'Allow linking a work/service to a project module.',
  'Allow automatic import of infrastructure assets.',
  'Block edits to imported assets except key fields.',
  'Allow reporting initial execution deadline.',
]

const initialDataB = [
  'Allow registering works/services linked to contracts with type and classification.',
  'Allow registering location via road and coordinates.',
  'Allow linking work/service to a project module or management module.',
  'Allow automatic import of infrastructure assets from the project.',
  'Block edits to imported assets, preserve integrity.',
  'Allow filtering classifications based on selected work type.',
  'Allow registering continuation between works.',
]

const parseText = (text) =>
  text
    .trim()
    .split(/\n/)
    .map((part) => part.trim())
    .filter(Boolean)

const applyFilter = (items, query) => {
  const needle = query.trim().toLowerCase()
  return items
    .map((text, originalIndex) => ({ text, originalIndex }))
    .filter(({ text }) => !needle || text.toLowerCase().includes(needle))
}

const getEndpoint = (side, rect, listRect, canvasRect) => {
  let y = rect.top + rect.height / 2
  let clamped = false
  if (y < listRect.top) {
    y = listRect.top + 6
    clamped = true
  } else if (y > listRect.bottom) {
    y = listRect.bottom - 6
    clamped = true
  }
  const x = (side === 'a' ? rect.right : rect.left) - canvasRect.left
  return { x, y: y - canvasRect.top, clamped }
}

const DocumentPanel = ({
  title,
  inputValue,
  onInputChange,
  onLoad,
  onPaste,
  onUpload,
  filterValue,
  onFilterChange,
  items,
  listRef,
  onItemDragStart,
  onItemDrop,
  onItemClick,
  isSelected,
  onScroll,
  side,
}) => (
  <section className="rounded-2xl bg-white p-4 shadow-xl shadow-slate-900/10">
    <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
    <div className="mt-3 space-y-2">
      <textarea
        className="h-32 w-full rounded-xl border border-slate-200 p-2 text-sm"
        value={inputValue}
        onChange={(event) => onInputChange(event.target.value)}
        placeholder={`Paste ${title} here. Use new lines between paragraphs.`}
      />
      <div className="flex flex-wrap items-center gap-2">
        <button className="rounded-full bg-slate-200 px-3 py-1 text-xs text-slate-900" type="button" onClick={onLoad}>
          Load {title}
        </button>
        <button className="rounded-full bg-slate-200 px-3 py-1 text-xs text-slate-900" type="button" onClick={onPaste}>
          Paste from clipboard
        </button>
        <label className="cursor-pointer rounded-full bg-slate-200 px-3 py-1 text-xs text-slate-900">
          Upload file
          <input className="hidden" type="file" accept=".txt" onChange={onUpload} />
        </label>
      </div>
    </div>
    <div className="mt-3">
      <input
        className="w-full rounded-full border border-slate-200 px-3 py-2 text-xs"
        value={filterValue}
        onChange={(event) => onFilterChange(event.target.value)}
        placeholder={`Filter ${title}`}
      />
    </div>
    <div ref={listRef} onScroll={onScroll} className="mt-3 max-h-[60vh] space-y-2 overflow-auto pr-2">
      {items.map(({ text, originalIndex }) => {
        const id = `${side}-${originalIndex}`
        return (
          <div
            key={id}
            data-id={id}
            draggable
            onDragStart={(event) => onItemDragStart(event, id)}
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => onItemDrop(event, id)}
            onClick={() => onItemClick(id)}
            className={`cursor-pointer rounded-xl border px-3 py-2 text-sm ${
              isSelected(id) ? 'border-blue-600 bg-blue-50' : 'border-slate-200 bg-slate-50'
            }`}
          >
            <strong className="block text-[11px] uppercase tracking-wide text-slate-500">
              {side.toUpperCase()} {originalIndex + 1}
            </strong>
            <div className="text-sm text-slate-900">{text}</div>
          </div>
        )
      })}
    </div>
  </section>
)

const LinksList = ({ links, onDelete }) => (
  <section className="mt-6 rounded-2xl bg-white p-4 shadow-xl shadow-slate-900/10">
    <h3 className="text-sm font-semibold text-slate-900">Links</h3>
    <ul className="mt-3 space-y-2 text-xs text-slate-600">
      {links.map((link, index) => (
        <li key={`${link.from}-${link.to}`} className="flex items-center justify-between rounded-lg px-2 py-1 hover:bg-slate-50">
          <span className="truncate">{link.from.toUpperCase()} → {link.to.toUpperCase()}</span>
          <button
            className="rounded-full bg-red-200 px-2 py-1 text-[11px] text-red-900"
            type="button"
            onClick={() => onDelete(index)}
          >
            Delete
          </button>
        </li>
      ))}
    </ul>
  </section>
)

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
  const [linkPaths, setLinkPaths] = useState([])

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

  const resetSelection = () => {
    setSelectedA(null)
    setSelectedB(new Set())
  }

  const isSelected = (id) => {
    if (!id) return false
    const side = id.split('-')[0]
    if (side === 'a') return selectedA === id
    return selectedB.has(id)
  }

  const addLink = (fromId, toId) => {
    if (fromId.split('-')[0] === toId.split('-')[0]) return
    setLinks((prev) => {
      if (prev.some((link) => link.from === fromId && link.to === toId)) return prev
      return [...prev, { from: fromId, to: toId }]
    })
    scheduleLayout()
  }

  const handleItemClick = (id) => {
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
  }

  const linkSelected = () => {
    if (!selectedA || selectedB.size === 0) return
    selectedB.forEach((id) => addLink(selectedA, id))
    resetSelection()
    scheduleLayout()
  }

  const shouldRenderLink = useCallback((link) => {
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
  }, [dataA, dataB, filterA, filterB])

  useLayoutEffect(() => {
    const listA = listARef.current
    const listB = listBRef.current
    const canvas = canvasRef.current
    if (!listA || !listB || !canvas) {
      return
    }
    const canvasRect = canvas.getBoundingClientRect()
    const listRectA = listA.getBoundingClientRect()
    const listRectB = listB.getBoundingClientRect()
    const nextPaths = links
      .map((link, index) => {
        if (!shouldRenderLink(link)) return null
        const fromEl = document.querySelector(`[data-id="${link.from}"]`)
        const toEl = document.querySelector(`[data-id="${link.to}"]`)
        if (!fromEl || !toEl) return null
        const fromRect = fromEl.getBoundingClientRect()
        const toRect = toEl.getBoundingClientRect()
        const fromSide = link.from.split('-')[0]
        const toSide = link.to.split('-')[0]
        const fromPoint = getEndpoint(fromSide, fromRect, fromSide === 'a' ? listRectA : listRectB, canvasRect)
        const toPoint = getEndpoint(toSide, toRect, toSide === 'a' ? listRectA : listRectB, canvasRect)
        const dx = (toPoint.x - fromPoint.x) / 2
        const d = `M ${fromPoint.x} ${fromPoint.y} C ${fromPoint.x + dx} ${fromPoint.y}, ${toPoint.x - dx} ${toPoint.y}, ${toPoint.x} ${toPoint.y}`
        return {
          index,
          d,
          fromPoint,
          toPoint,
          clamped: fromPoint.clamped || toPoint.clamped,
        }
      })
      .filter(Boolean)
    setLinkPaths(nextPaths)
  }, [links, shouldRenderLink, layoutTick])

  const visibleLinks = useMemo(() => links.filter(shouldRenderLink), [links, shouldRenderLink])

  const loadFromInput = (side) => {
    const list = parseText(side === 'a' ? inputA : inputB)
    if (side === 'a') {
      setDataA(list)
    } else {
      setDataB(list)
    }
  }

  const handlePaste = async (side) => {
    const text = await navigator.clipboard.readText()
    if (side === 'a') {
      setInputA(text)
      setDataA(parseText(text))
    } else {
      setInputB(text)
      setDataB(parseText(text))
    }
  }

  const handleUpload = async (side, event) => {
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
  }

  const handleDragStart = (event, id) => {
    event.dataTransfer.setData('text/plain', id)
    scheduleLayout()
  }

  const handleDrop = (event, id) => {
    event.preventDefault()
    const sourceId = event.dataTransfer.getData('text/plain')
    if (!sourceId) return
    addLink(sourceId, id)
    scheduleLayout()
  }

  const handleScrollA = () => {
    if (syncScroll && listARef.current && listBRef.current && !syncingRef.current) {
      syncingRef.current = true
      listBRef.current.scrollTop = listARef.current.scrollTop
      syncingRef.current = false
    }
    scheduleLayout()
  }

  const handleScrollB = () => {
    if (syncScroll && listARef.current && listBRef.current && !syncingRef.current) {
      syncingRef.current = true
      listARef.current.scrollTop = listBRef.current.scrollTop
      syncingRef.current = false
    }
    scheduleLayout()
  }

  const deleteLink = (index) => {
    setLinks((prev) => prev.filter((_, idx) => idx !== index))
    setHoveredLink(null)
    scheduleLayout()
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="flex flex-wrap items-start justify-between gap-4 px-8 pb-3 pt-6">
        <div>
          <h1 className="text-2xl font-semibold">Requirements Linker</h1>
          <p className="mt-1 text-sm text-slate-600">
            Drag a paragraph from the left into one or more paragraphs on the right to create links.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button className="rounded-full bg-blue-600 px-3 py-1 text-xs text-white" type="button" onClick={() => setLinks([])}>
            Clear links
          </button>
          <button
            className="rounded-full bg-slate-200 px-3 py-1 text-xs text-slate-900"
            type="button"
            onClick={async () => {
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
            }}
          >
            Copy links as JSON
          </button>
          <button
            className={`rounded-full px-3 py-1 text-xs ${mode === 'single' ? 'bg-blue-700 text-white' : 'bg-slate-200 text-slate-900'}`}
            type="button"
            onClick={() => {
              setMode('single')
              resetSelection()
            }}
          >
            Single select
          </button>
          <button
            className={`rounded-full px-3 py-1 text-xs ${mode === 'multi' ? 'bg-blue-700 text-white' : 'bg-slate-200 text-slate-900'}`}
            type="button"
            onClick={() => {
              setMode('multi')
              resetSelection()
            }}
          >
            Multi select
          </button>
          <button
            className="rounded-full bg-blue-600 px-3 py-1 text-xs text-white disabled:cursor-not-allowed disabled:opacity-50"
            type="button"
            disabled={mode !== 'multi'}
            onClick={linkSelected}
          >
            Link selected
          </button>
          <label className="flex items-center gap-2 text-xs text-slate-700">
            <input
              type="checkbox"
              checked={syncScroll}
              onChange={(event) => setSyncScroll(event.target.checked)}
            />
            Sync scroll
          </label>
          <span className="text-xs text-slate-400">{links.length} links</span>
        </div>
      </header>

      <div className="grid grid-cols-[minmax(0,1fr)_60px_minmax(0,1fr)] items-start gap-4 px-8 pb-8">
        <DocumentPanel
          title="Document A"
          inputValue={inputA}
          onInputChange={setInputA}
          onLoad={() => loadFromInput('a')}
          onPaste={() => handlePaste('a')}
          onUpload={(event) => handleUpload('a', event)}
          filterValue={filterA}
          onFilterChange={setFilterA}
          items={filteredA}
          listRef={(node) => {
            listARef.current = node
          }}
          onItemDragStart={handleDragStart}
          onItemDrop={handleDrop}
          onItemClick={handleItemClick}
          onScroll={handleScrollA}
          isSelected={isSelected}
          side="a"
        />

        <div className="relative flex items-stretch justify-center">
          <svg ref={canvasRef} className="h-full w-full overflow-visible">
            <defs>
              {linkPaths
                .filter((path) => path.clamped)
                .map((path) => (
                  <linearGradient
                    key={`gradient-${path.index}`}
                    id={`gradient-${path.index}`}
                    gradientUnits="userSpaceOnUse"
                    x1={path.fromPoint.x}
                    y1={path.fromPoint.y}
                    x2={path.toPoint.x}
                    y2={path.toPoint.y}
                  >
                    <stop offset="0%" stopColor="#2563eb" stopOpacity={path.fromPoint.clamped ? 0.15 : 1} />
                    <stop offset="100%" stopColor="#2563eb" stopOpacity={path.toPoint.clamped ? 0.15 : 1} />
                  </linearGradient>
                ))}
            </defs>
            {linkPaths.map((path) => (
              <path
                key={`link-${path.index}`}
                d={path.d}
                className="link-path"
                stroke={path.clamped ? `url(#gradient-${path.index})` : '#2563eb'}
                strokeWidth={2}
                fill="none"
                onMouseEnter={() => {
                  setHoveredLink({
                    index: path.index,
                    x: (path.fromPoint.x + path.toPoint.x) / 2,
                    y: (path.fromPoint.y + path.toPoint.y) / 2,
                  })
                }}
                onMouseLeave={(event) => {
                  if (event.relatedTarget?.id === 'delete-link') return
                  setHoveredLink(null)
                }}
              />
            ))}
          </svg>
          {hoveredLink && (
            <button
              id="delete-link"
              type="button"
              className="absolute flex h-7 w-7 items-center justify-center rounded-full bg-red-100 text-sm text-red-900 shadow-lg"
              style={{ left: hoveredLink.x, top: hoveredLink.y }}
              onClick={() => deleteLink(hoveredLink.index)}
              onMouseLeave={() => setHoveredLink(null)}
            >
              ✕
            </button>
          )}
        </div>

        <DocumentPanel
          title="Document B"
          inputValue={inputB}
          onInputChange={setInputB}
          onLoad={() => loadFromInput('b')}
          onPaste={() => handlePaste('b')}
          onUpload={(event) => handleUpload('b', event)}
          filterValue={filterB}
          onFilterChange={setFilterB}
          items={filteredB}
          listRef={(node) => {
            listBRef.current = node
          }}
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
