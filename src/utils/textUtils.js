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
