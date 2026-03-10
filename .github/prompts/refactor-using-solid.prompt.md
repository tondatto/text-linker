## Plan: SOLID Phase 1 Refactor

Refactor the current monolithic container into clearer responsibilities without changing UI/UX or adding dependencies. Focus on low-risk extractions from `App.jsx` and `requirements.js`, reduce coupling at module boundaries, and add minimal Vitest coverage for extracted pure logic so future SOLID phases are safer.

**Steps**
1. Baseline and safety checks: capture current behavior expectations and run `npm run lint` + `npm run build` before refactor to establish a clean baseline. This step blocks all refactor steps.
2. Phase A - Utilities SRP split (*depends on 1*): break `src/utils/requirements.js` into responsibility-specific modules while preserving exports and runtime behavior.
3. Phase A details: move text parsing/filtering helpers (`parseText`, `applyFilter`) to a text-focused utility module, keep geometry helper (`getEndpoint`) in a geometry module, and isolate Ollama request orchestration (`suggestLinksWithOllama`, batch/timeout/parsing helpers, constants) in a service module.
4. Phase A compatibility pass (*depends on 2-3*): keep a thin compatibility barrel in `src/utils/requirements.js` (or update imports directly in one pass) so app behavior remains unchanged while reducing module coupling.
5. Phase B - App-level responsibility extraction (*depends on 4*): extract workspace persistence logic (`saveWorkspace`, `loadWorkspace`, status messaging contract) into a custom hook/service boundary consumed by `App.jsx`.
6. Phase B details: extract suggestion-run orchestration (loading/error/abort lifecycle + suggestion merge policy) into a dedicated hook/service interface used by `App.jsx`; keep UI trigger points and messages unchanged.
7. Phase C - Interface tightening in presentation layer (*parallel with 5-6 if done as adapter-first*): reduce prop surface for `TopBar` by grouping related controls into object props (workspace actions, mode actions, suggestion actions, view actions), while preserving rendered output and interaction behavior.
8. Phase C details (*depends on 7*): optionally apply same contract-shaping to `DocumentPanel` callback props (interaction object) only if no behavior diff is introduced; defer deeper composition changes to later phases.
9. Phase D - Minimal automated tests (*depends on 2-6*): add Vitest-based unit coverage for extracted pure logic and service parsing paths, prioritizing deterministic helpers (`parseText`, `applyFilter`, confidence clamping/parsing behavior, prompt/chunk utilities) and mock network boundaries for Ollama service.
10. Integration and regression verification (*depends on 5-9*): run lint/build/tests and perform manual UI checks for linking flows, multi-select linking, scroll sync, editor import/paste/save-load, and suggestion flows including cancellation/error states.
11. Cleanup and documentation (*depends on 10*): remove dead imports/compat shims that are no longer needed, and update `README.md` with the new module map and test command.

**Relevant files**
- `/home/tondatto/Workspace/text-link/src/App.jsx` - main orchestration to slim down by delegating persistence and suggestion concerns.
- `/home/tondatto/Workspace/text-link/src/utils/requirements.js` - current mixed-responsibility module; convert into compatibility entry or remove after import migration.
- `/home/tondatto/Workspace/text-link/src/hooks/useLinkLayout.js` - preserve as-is in Phase 1; reference as existing extraction pattern.
- `/home/tondatto/Workspace/text-link/src/components/TopBar.jsx` - reduce ISP pressure by tightening prop contracts without visual change.
- `/home/tondatto/Workspace/text-link/src/components/DocumentPanel.jsx` - optional prop contract shaping if low-risk.
- `/home/tondatto/Workspace/text-link/package.json` - add test script for Vitest only if dependency already present or approved.
- `/home/tondatto/Workspace/text-link/README.md` - document updated architecture and verification commands.

**Verification**
1. Pre/post refactor: run `npm run lint` and compare warnings/errors.
2. Pre/post refactor: run `npm run build` to ensure module graph and production build integrity.
3. Automated: run `npm test` (or `vitest`) for new utility/service tests and confirm pass rate.
4. Manual: verify same UI interactions in `npm run dev`, specifically selection, drag/drop linking, delete/copy links, editor open/close/submit/upload/paste, sync/full scroll toggles, and suggestion run/cancel/error/success messages.
5. Manual regression: confirm saved workspace round-trip still restores mode, links, datasets, and scroll toggles.

**Decisions**
- Included scope: SOLID Phase 1 low-risk extractions only.
- Excluded scope: state architecture overhaul (Context/Reducer), link identity model redesign, and deep DOM-query removal in `useLinkLayout`.
- Constraints: preserve existing UI/UX and avoid adding non-essential dependencies.
- Testing decision: include minimal Vitest coverage focused on extracted deterministic logic and service parsing behavior.

**Further Considerations**
1. `Vitest dependency policy`: if `vitest` is not currently installed, either add it as a single dev dependency (recommended for maintainability) or keep tests deferred and rely on lint/build/manual verification.
2. `Compatibility strategy`: prefer a temporary compatibility barrel in `src/utils/requirements.js` during migration to reduce breakage risk, then remove once imports are fully updated.
3. `TopBar contract granularity`: group props conservatively in Phase 1 to reduce churn; defer visual/component decomposition to a later SOLID phase.
