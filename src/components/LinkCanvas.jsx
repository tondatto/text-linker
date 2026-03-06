const LinkCanvas = ({
  linkPaths,
  onDelete,
  onSelect,
  canvasRef,
  selectedIndex,
}) => (
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
          stroke={path.clamped ? `url(#gradient-${path.index})` : '#2563eb'}
          strokeWidth={2}
          fill="none"
          onClick={() => onSelect(path)}
          className={`link-path ${selectedIndex === path.index ? 'link-path--active' : ''}`}
        />
      ))}
    </svg>
    {selectedIndex !== null ? (
      (() => {
        const selectedPath = linkPaths.find((path) => path.index === selectedIndex)
        if (!selectedPath) return null
        return (
          <button
            id="delete-link"
            type="button"
            className="absolute z-10 flex h-7 w-7 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-red-100 text-sm text-red-900 shadow-lg"
            style={{
              left: (selectedPath.fromPoint.x + selectedPath.toPoint.x) / 2,
              top: (selectedPath.fromPoint.y + selectedPath.toPoint.y) / 2,
            }}
            onClick={() => onDelete(selectedIndex)}
          >
            ✕
          </button>
        )
      })()
    ) : null}
  </div>
)

export default LinkCanvas
