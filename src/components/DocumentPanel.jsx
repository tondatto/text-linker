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
  fullScroll,
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
    <div
      ref={listRef}
      onScroll={onScroll}
      className={`mt-3 space-y-2 pr-2 ${fullScroll ? '' : 'max-h-[60vh] overflow-auto'}`}
    >
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

export default DocumentPanel
