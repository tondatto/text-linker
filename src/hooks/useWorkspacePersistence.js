import { useCallback } from 'react'

const WORKSPACE_STORAGE_KEY = 'text-linker-workspace'

const useWorkspacePersistence = ({
  dataA,
  dataB,
  links,
  mode,
  syncScroll,
  fullScroll,
  setDataA,
  setDataB,
  setLinks,
  setMode,
  setSyncScroll,
  setFullScroll,
  setWorkspaceStatus,
  resetSelection,
  scheduleLayout,
  initialDataA,
  initialDataB,
}) => {
  const saveWorkspace = useCallback(() => {
    const payload = {
      dataA,
      dataB,
      links,
      mode,
      syncScroll,
      fullScroll,
    }
    window.localStorage.setItem(WORKSPACE_STORAGE_KEY, JSON.stringify(payload))
    setWorkspaceStatus('Workspace saved')
  }, [dataA, dataB, fullScroll, links, mode, setWorkspaceStatus, syncScroll])

  const loadWorkspace = useCallback(() => {
    const raw = window.localStorage.getItem(WORKSPACE_STORAGE_KEY)
    if (!raw) {
      setWorkspaceStatus('No saved workspace')
      return
    }
    try {
      const payload = JSON.parse(raw)
      setDataA(Array.isArray(payload.dataA) ? payload.dataA : initialDataA)
      setDataB(Array.isArray(payload.dataB) ? payload.dataB : initialDataB)
      setLinks(Array.isArray(payload.links) ? payload.links : [])
      setMode(payload.mode === 'multi' ? 'multi' : 'single')
      setSyncScroll(Boolean(payload.syncScroll))
      setFullScroll(Boolean(payload.fullScroll))
      resetSelection()
      scheduleLayout()
      setWorkspaceStatus('Workspace loaded')
    } catch {
      setWorkspaceStatus('Invalid workspace data')
    }
  }, [
    initialDataA,
    initialDataB,
    resetSelection,
    scheduleLayout,
    setDataA,
    setDataB,
    setFullScroll,
    setLinks,
    setMode,
    setSyncScroll,
    setWorkspaceStatus,
  ])

  return {
    saveWorkspace,
    loadWorkspace,
  }
}

export default useWorkspacePersistence
