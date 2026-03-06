## Plan: Prototype-Style Icon Menu + Load Popup

We’ll refactor the current top menu in [src/components/TopBar.jsx](src/components/TopBar.jsx) to match your prototype behavior: icon-only actions with custom styled tooltips. We’ll also remove inline text input areas from [src/components/DocumentPanel.jsx](src/components/DocumentPanel.jsx), and move document loading into a popup editor flow controlled by [src/App.jsx](src/App.jsx). The popup will support text editor + Load + Paste + Upload (for each document), preserving existing parsing through `parseText` in [src/utils/requirements.js](src/utils/requirements.js). This keeps the current data/link logic intact while changing only interaction UX and presentation.

**Steps**
1. Add popup/editor state in [src/App.jsx](src/App.jsx) for `activeEditorDoc` (`a`/`b`/null) and `editorText`; add handlers `openEditor`, `closeEditor`, `submitEditorText`, `pasteIntoEditor`, and `uploadIntoEditor` that reuse `parseText`.
2. Replace current top-menu document load callbacks in [src/App.jsx](src/App.jsx) so `onLoadA`/`onLoadB` open the popup (instead of directly parsing hidden `inputA`/`inputB` text).
3. Refactor document input architecture in [src/App.jsx](src/App.jsx): remove obsolete `inputA`/`inputB` state and their panel prop wiring; keep filter/list/link states unchanged.
4. Simplify [src/components/DocumentPanel.jsx](src/components/DocumentPanel.jsx): remove textarea block entirely, keep title + filter + item list + linked-item highlighting exactly as-is.
5. Refactor [src/components/TopBar.jsx](src/components/TopBar.jsx) menu actions to icon-only controls: keep group structure, remove labels from button surface, and add consistent custom tooltip wrappers for every action.
6. Implement reusable custom tooltip styling (prototype-like) in [src/index.css](src/index.css) (or [src/App.css](src/App.css) if that file currently owns component-level style), then apply tooltip classes in `TopBar`.
7. Add a modal/popup UI in [src/App.jsx](src/App.jsx) with:
   - Header indicating target doc (Document A/B)
   - Text editor textarea
   - Actions: Load, Paste from clipboard, Upload file, Cancel
   - Overlay + focus-close behavior (Escape/backdrop)
8. Ensure upload flow inside popup handles same-file reselect by resetting the file input value after read, and preserve existing `parseText` output behavior.

**Verification**
- Run `npm run build`.
- Manual checks:
  - Top menu shows icon-only actions with custom tooltips on hover.
  - No input textarea is visible in either document panel.
  - Clicking Load Document A/B opens popup editor for the selected side.
  - In popup, Paste and Upload fill editor content; Load applies parsed items to the correct document.
  - Existing link creation, deletion, and linked-item highlight behavior remain unchanged.

**Decisions**
- Popup scope: include text editor + Load + Paste + Upload in the popup.
- Tooltip style: custom styled tooltips (not native `title`).
