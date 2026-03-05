const LinksList = ({ links, onDelete }) => (
  <section className="mt-6 rounded-2xl bg-white p-4 shadow-xl shadow-slate-900/10">
    <h3 className="text-sm font-semibold text-slate-900">Links</h3>
    <ul className="mt-3 space-y-2 text-xs text-slate-600">
      {links.map((link, index) => (
        <li key={`${link.from}-${link.to}`} className="flex items-center justify-between rounded-lg px-2 py-1 hover:bg-slate-50">
          <span className="truncate">
            {link.from.toUpperCase()} → {link.to.toUpperCase()}
          </span>
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

export default LinksList
