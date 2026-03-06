const LinkCanvas = ({
  linkPaths,
  hoveredLink,
  onHover,
  onLeave,
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
          onMouseEnter={() => onHover(path)}
          onMouseLeave={onLeave}
          onClick={() => onSelect(path)}
          className={`link-path ${selectedIndex === path.index ? 'link-path--active' : ''}`}
        />
      ))}
    </svg>
    {hoveredLink && (
      <button
        id="delete-link"
        type="button"
        className="absolute z-10 flex h-7 w-7 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-red-100 text-sm text-red-900 shadow-lg"
        style={{ left: hoveredLink.x, top: hoveredLink.y }}
        onClick={() => onDelete(hoveredLink.index)}
        onMouseLeave={() => onLeave()}
      >
        ✕
      </button>
    )}
  </div>
)

export default LinkCanvas
