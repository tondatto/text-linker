# Text Linker

Text Linker is a web app for comparing two text documents and creating visual links between related paragraphs.

It is useful for scenarios such as:
- linking a product vision document to a requirements document;
- comparing two versions of the same requirements specification;
- identifying traceability between textual artifacts.

The app provides a simple visual workflow: load two documents, inspect each paragraph as an item, and create explicit relationships between both sides.

## Motivation

This project came from a recurring need: analyzing two documents and identifying which paragraphs are related to each other.

In practice, this happens often when comparing:
- a product vision document with a requirements document;
- two different versions of the same requirements document;
- any pair of textual artifacts that need traceability.

The goal of Text Linker is to make this comparison easier through a visual interface that shows relationships between paragraphs from two documents.

## Features

- Load two different text documents for side-by-side analysis
- Visual paragraph linking between Document A and Document B
- Drag-and-drop linking
- Single-select and multi-select linking modes
- Linked item highlighting
- Filter items in both documents
- Save and load workspace state from local storage
- Copy links as JSON
- Fixed top toolbar with quick actions
- AI-assisted link suggestions with Ollama (localhost)

## Tech Stack

- React
- Vite
- Tailwind CSS
- JavaScript (ES modules)
- Browser Local Storage API
- Google Material Symbols

## Getting Started

### Prerequisites

- Node.js 18+
- npm

### Installation

```bash
npm install
```

### Run locally

```bash
npm run dev
```

Then open the local URL shown in the terminal.

## Available Commands

| Command | Description |
|---|---|
| `npm run dev` | Starts the development server |
| `npm run lint` | Runs ESLint |
| `npm run build` | Creates a production build |
| `npm run preview` | Serves the production build locally |

## How to Use

1. Open the editor for Document A and load text content.
2. Open the editor for Document B and load text content.
3. Review the generated paragraph items on both sides.
4. Create links by drag-and-drop or by using selection modes.
5. Filter documents to focus on specific content.
6. Save the workspace or copy links as JSON when needed.

## Ollama Suggestions

Text Linker can suggest links automatically by calling Ollama running on your machine.

### Setup

1. Install Ollama from the official instructions for your OS.
2. Start the Ollama server:

```bash
ollama serve
```

3. Pull the default model used by this project:

```bash
ollama pull llama3.1:8b
```

4. Start Text Linker in dev mode:

```bash
npm run dev
```

### Suggest Links Workflow

1. Load both documents.
2. Click the `Suggest links` button in the top toolbar.
3. The app requests candidate matches from Ollama.
4. Only suggestions with confidence `>= 0.85` are auto-added.
5. Existing links are preserved and duplicate suggestions are skipped.

### Notes

- Default model: `llama3.1:8b`
- Scope: all items in Document A against all items in Document B
- Transport: Vite dev proxy routes `/api/ollama/*` to `http://localhost:11434`

### Troubleshooting

- `Suggestion failed: Ollama request failed (...)`:
	Ensure `ollama serve` is running and reachable on port `11434`.
- No suggestions returned:
	Verify document content is loaded and try smaller documents first.
- Slow runs on large documents:
	Use a smaller model or split documents into fewer, larger paragraphs.

## Project Structure

```text
src/
	components/   # UI components
	data/         # Initial sample content
	hooks/        # Layout and interaction hooks
	utils/        # Parsing and helper functions
```

## Use Cases

- Requirements traceability
- Gap analysis between product vision and specification
- Version comparison of structured text documents
- Manual validation of semantic relationships between paragraphs

## Roadmap

Planned improvements:

- Filter unrelated items
- Highlight unrelated items
- Move the links panel to a popup opened from the active links status
- Allow renaming Document A and Document B

## Why this project may be useful

Many document comparison tools focus on textual diffs, but not on semantic relationships between sections or paragraphs.

Text Linker focuses on explicit human-driven mapping, which can be valuable when the goal is understanding traceability rather than only identifying changed text.

## Contributing

Suggestions, issues, and pull requests are welcome.

If you want to improve the UX, expand the export options, or add smarter relationship assistance, contributions are encouraged.

## License

MIT License. See LICENSE file for details.
