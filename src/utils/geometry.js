export const getEndpoint = (side, rect, listRect, canvasRect) => {
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
