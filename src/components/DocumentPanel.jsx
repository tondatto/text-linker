const DocumentPanel = ({
  title,
  inputValue,
  onInputChange,
  filterValue,
  onFilterChange,
  items,
  listRef,
  onItemDragStart,
  onItemDrop,
  onItemClick,
  isSelected,
  hasLink,
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
        const linked = hasLink(id)
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
              isSelected(id)
                ? 'border-blue-600 bg-blue-50'
                : linked
                  ? 'border-emerald-200 bg-emerald-50'
                  : 'border-slate-200 bg-slate-50'
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
