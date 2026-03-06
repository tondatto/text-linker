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
  syncScroll,
  onSyncScrollChange,
  fullScroll,
  onFullScrollChange,
  status,
}) => {
  const Icon = ({ name }) => <span className="material-symbols-outlined text-base leading-none">{name}</span>

  const MenuButton = ({ icon, label, onClick, disabled = false, active = false }) => {
    const baseClass = `tl-tooltip inline-flex h-9 w-9 items-center justify-center rounded-lg border text-slate-700 transition ${
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

  const Group = ({ title, icon, children }) => (
    <div className="rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2">
      <div className="mb-2 inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
        <Icon name={icon} />
        <span>{title}</span>
      </div>
      <div className="flex flex-wrap items-center gap-2">{children}</div>
    </div>
  )

  return (
    <header className="px-8 pb-3 pt-6">
      <div>
        <h1 className="text-2xl font-semibold">Text Linker</h1>
        <p className="mt-1 text-sm text-slate-600">
          Drag a paragraph from the left into one or more paragraphs on the right to create links.
        </p>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-4">
        <Group title="Workspace" icon="folder">
          <MenuButton icon="save" label="Save workspace" onClick={onSave} />
          <MenuButton icon="folder_open" label="Load workspace" onClick={onLoad} />
        </Group>

        <Group title="Document A" icon="description">
          <MenuButton icon="edit_document" label="Open editor for Document A" onClick={onLoadA} />
        </Group>

        <Group title="Document B" icon="article">
          <MenuButton icon="edit_document" label="Open editor for Document B" onClick={onLoadB} />
        </Group>

        <Group title="Links" icon="share">
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
          <span className="inline-flex h-9 items-center rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-500">
            {linksCount} links
          </span>
        </Group>
      </div>

      {status ? <p className="mt-2 text-xs text-slate-500">{status}</p> : null}
    </header>
  )
}

export default TopBar
