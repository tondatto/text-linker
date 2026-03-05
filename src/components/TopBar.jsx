const TopBar = ({
  mode,
  linksCount,
  onClear,
  onCopy,
  onModeChange,
  onLinkSelected,
  syncScroll,
  onSyncScrollChange,
}) => (
  <header className="flex flex-wrap items-start justify-between gap-4 px-8 pb-3 pt-6">
    <div>
      <h1 className="text-2xl font-semibold">Requirements Linker</h1>
      <p className="mt-1 text-sm text-slate-600">
        Drag a paragraph from the left into one or more paragraphs on the right to create links.
      </p>
    </div>
    <div className="flex flex-wrap items-center gap-2">
      <button className="rounded-full bg-blue-600 px-3 py-1 text-xs text-white" type="button" onClick={onClear}>
        Clear links
      </button>
      <button className="rounded-full bg-slate-200 px-3 py-1 text-xs text-slate-900" type="button" onClick={onCopy}>
        Copy links as JSON
      </button>
      <button
        className={`rounded-full px-3 py-1 text-xs ${mode === 'single' ? 'bg-blue-700 text-white' : 'bg-slate-200 text-slate-900'}`}
        type="button"
        onClick={() => onModeChange('single')}
      >
        Single select
      </button>
      <button
        className={`rounded-full px-3 py-1 text-xs ${mode === 'multi' ? 'bg-blue-700 text-white' : 'bg-slate-200 text-slate-900'}`}
        type="button"
        onClick={() => onModeChange('multi')}
      >
        Multi select
      </button>
      <button
        className="rounded-full bg-blue-600 px-3 py-1 text-xs text-white disabled:cursor-not-allowed disabled:opacity-50"
        type="button"
        disabled={mode !== 'multi'}
        onClick={onLinkSelected}
      >
        Link selected
      </button>
      <label className="flex items-center gap-2 text-xs text-slate-700">
        <input type="checkbox" checked={syncScroll} onChange={(event) => onSyncScrollChange(event.target.checked)} />
        Sync scroll
      </label>
      <span className="text-xs text-slate-400">{linksCount} links</span>
    </div>
  </header>
)

export default TopBar
