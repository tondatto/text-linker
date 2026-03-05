import { useLayoutEffect, useState } from 'react'

const useLinkLayout = ({ links, listARef, listBRef, canvasRef, getEndpoint, shouldRenderLink, layoutTick }) => {
  const [linkPaths, setLinkPaths] = useState([])

  useLayoutEffect(() => {
    const listA = listARef.current
    const listB = listBRef.current
    const canvas = canvasRef.current
    if (!listA || !listB || !canvas) return

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
  }, [links, listARef, listBRef, canvasRef, getEndpoint, shouldRenderLink, layoutTick])

  return linkPaths
}

export default useLinkLayout
