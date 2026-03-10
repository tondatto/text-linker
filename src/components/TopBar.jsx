const Icon = ({ name }) => <span className="material-symbols-outlined text-base leading-none">{name}</span>

const MenuButton = ({ icon, label, onClick, disabled = false, active = false }) => {
  const baseClass = `tl-tooltip inline-flex h-8 w-8 items-center justify-center rounded-md border text-slate-700 transition ${
    active
      ? 'border-blue-600 bg-blue-600 text-white'
      : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-100'
  }`

  return (
    <button className={baseClass} type="button" onClick={onClick} disabled={disabled} aria-label={label}>
      <Icon name={icon} />
      <span className="tl-tooltip-text">{label}</span>
    </button>
  )
}

const Group = ({ title, children }) => (
  <div className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50/70 px-2 py-1">
    <div className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
      <span>{title}</span>
    </div>
    <div className="flex items-center gap-1.5">{children}</div>
  </div>
)

const TopBar = ({
  mode,
  linksCount,
  onClear,
  onCopy,
  onSave,
  onLoad,
  onLoadA,
  onLoadB,
  onModeChange,
  onLinkSelected,
  onSuggestLinks,
  suggestionLoading,
  syncScroll,
  onSyncScrollChange,
  fullScroll,
  onFullScrollChange,
  status,
}) => {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-slate-200 bg-white px-5 py-2">
      <div className="flex justify-between items-center gap-5">
        <h1 className="shrink-0 text-2xl font-semibold text-slate-800">Text Linker</h1>

        <div className="flex min-w-0 flex-1 items-center justify-center gap-2 overflow-visible pt-2 pb-0">
          <Group title="WORK">
            <MenuButton icon="save" label="Save workspace" onClick={onSave} />
            <MenuButton icon="folder_open" label="Load workspace" onClick={onLoad} />
          </Group>

          <Group title="DOC A">
            <MenuButton icon="edit_document" label="Open editor for Document A" onClick={onLoadA} />
          </Group>

          <Group title="DOC B">
            <MenuButton icon="edit_document" label="Open editor for Document B" onClick={onLoadB} />
          </Group>

          <Group title="Links">
            <MenuButton icon="delete_sweep" label="Clear links" onClick={onClear} />
            <MenuButton icon="content_copy" label="Copy links as JSON" onClick={onCopy} />
            <MenuButton
              icon="radio_button_checked"
              label="Single select"
              active={mode === 'single'}
              onClick={() => onModeChange('single')}
            />
            <MenuButton icon="checklist" label="Multi select" active={mode === 'multi'} onClick={() => onModeChange('multi')} />
            <MenuButton icon="add_link" label="Link selected" onClick={onLinkSelected} disabled={mode !== 'multi'} />
            <MenuButton
              icon="auto_awesome"
              label={suggestionLoading ? 'Suggesting links...' : 'Suggest links'}
              onClick={onSuggestLinks}
              disabled={suggestionLoading}
            />
            <MenuButton
              icon="sync"
              label="Sync scroll"
              active={syncScroll}
              onClick={() => onSyncScrollChange(!syncScroll)}
            />
            <MenuButton
              icon="unfold_more"
              label="Expand documents"
              active={fullScroll}
              onClick={() => onFullScrollChange(!fullScroll)}
            />
          </Group>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          {status ? <p className="text-xs text-slate-500">{status}</p> : null}
          <span className="inline-flex h-8 items-center rounded-full bg-blue-100 px-3 text-xs font-semibold uppercase tracking-wide text-blue-700">
            {linksCount} links active
          </span>
        </div>
      </div>
    </header>
  )
}

export default TopBar
