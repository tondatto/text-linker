export const parseText = (text) =>
  text
    .trim()
    .split(/\n/)
    .map((part) => part.trim())
    .filter(Boolean)

export const applyFilter = (items, query) => {
  const needle = query.trim().toLowerCase()
  return items
    .map((text, originalIndex) => ({ text, originalIndex }))
    .filter(({ text }) => !needle || text.toLowerCase().includes(needle))
}

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
