## Plan: Ollama Link Suggestion Integration

Integrate localhost Ollama into the existing React/Vite app to generate item-to-item link suggestions across both documents, then auto-create only high-confidence links using current link validation paths. The safest approach is a strict JSON-output matching pipeline with batching, confidence thresholds, and fallback handling, wired into `App.jsx` orchestration and a new TopBar action.

**Steps**
1. Define suggestion contract and thresholds in `src/utils/requirements.js`.
Add constants for Ollama endpoint path, batch size, max item length, temperature, and `AUTO_LINK_CONFIDENCE_THRESHOLD` (for example 0.85). Define a normalized suggestion shape `{ from, to, confidence, reason }` using existing item ID conventions (`a-idx`, `b-idx`).
2. Implement Ollama client and parser in `src/utils/requirements.js`.
Create `suggestLinksWithOllama({ itemsA, itemsB, model, signal })` that:
- Builds deterministic prompts requesting strict JSON only.
- Calls Ollama generate/chat API through a relative proxied path.
- Parses/validates JSON, drops malformed rows, clamps confidence 0..1.
- Maps returned indices to app IDs (`a-i`, `b-j`).
This step blocks Step 4 and Step 5.
3. Add batching and resilience logic in `src/utils/requirements.js`.
Split large documents into bounded chunks to avoid token overflow, run sequentially with cancellation support (`AbortController`), and merge/deduplicate by pair, keeping the highest confidence. Add safe fallback (empty suggestions) on parse/network/model failures with actionable error messages.
4. Extend app state and orchestration in `src/App.jsx`.
Add state for `suggestionLoading`, `suggestionError`, `lastSuggestionRunAt`, and optional `rawSuggestions`. Add `handleSuggestLinks()` to run global A-vs-B matching using parsed document arrays, then filter by confidence threshold and feed accepted pairs through existing `addLink()` logic to preserve dedupe/same-side guardrails. This depends on Step 2-3.
5. Wire UI trigger and status in `src/components/TopBar.jsx` and `src/App.jsx`.
Add a `Suggest links` button in TopBar’s links group. Disable during in-flight runs; show loading label/state. Display success/error status using existing workspace status area so users know how many links were auto-added vs ignored.
6. Configure local Ollama access via dev proxy in `vite.config.js`.
Add dev server proxy route (for example `/api/ollama -> http://localhost:11434`) and update client calls to use proxied relative URL. This reduces CORS friction during local dev. This can run in parallel with Step 4.
7. Add minimal observability and guardrails.
Log structured debug info in development only (batch counts, model latency, accepted/rejected counts). Enforce max runtime per run and early-cancel behavior when inputs change.
8. Update docs in `README.md`.
Document required Ollama setup (`ollama serve`, `ollama pull qwen2.5:7b`), expected model name config, confidence behavior, and troubleshooting for proxy/CORS and malformed model output.

**Relevant files**
- `/home/tondatto/Workspace/text-link/src/utils/requirements.js` — add Ollama client, prompt builder, parser, batching, and confidence filter helpers near existing `parseText` utilities.
- `/home/tondatto/Workspace/text-link/src/App.jsx` — add suggestion run state, `handleSuggestLinks`, and integration with `addLink`/workspace status updates.
- `/home/tondatto/Workspace/text-link/src/components/TopBar.jsx` — add `Suggest links` control and loading/disabled behavior.
- `/home/tondatto/Workspace/text-link/vite.config.js` — add localhost Ollama proxy config.
- `/home/tondatto/Workspace/text-link/README.md` — add setup/use/troubleshooting section.

**Verification**
1. Run app in dev with Ollama running and `qwen2.5:7b` available; trigger Suggest links and confirm no browser CORS errors.
2. Validate only cross-side links are created and duplicates are prevented by existing `addLink()` path.
3. Use a fixture with known matches and confirm high-confidence pairs are auto-added while low-confidence pairs are skipped.
4. Simulate Ollama malformed output and network timeout; confirm app surfaces non-blocking error status and does not crash.
5. Test large inputs to confirm batching prevents timeouts/token overflow and UI remains responsive.
6. Confirm manual linking workflows (single click, drag/drop, multi-select link) still behave unchanged.

**Decisions**
- Model: `qwen2.5:7b`.
- Matching scope: global all-items in document A vs B.
- Suggestion flow: auto-add high-confidence links only; low-confidence suggestions are ignored for this phase.
- Included: localhost Ollama integration, auto-link thresholding, proxy setup, docs.
- Excluded: backend service, persistent suggestion review queue, model benchmarking UI.

**Further Considerations**
1. Confidence threshold tuning recommendation: start at `0.85`, then adjust with a small labeled dataset from your documents.
2. Prompt language recommendation: keep prompts in English with explicit JSON schema for most stable model formatting.
3. Future extension option: add a second mode that stores low-confidence suggestions for manual review if recall is too low.
