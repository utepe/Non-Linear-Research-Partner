# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

This is a CSE 593: Human-Computer Interaction (Winter 2026) research project at the University of Michigan (Group 10). The `Project/` directory contains a functional high-fidelity prototype of the research system: a canvas-based, non-linear AI research workspace built in React + TypeScript.

Team members: Maaz Hussain, Anand Parikh, Uygur Tepe, Xiaochi Yang

## Getting Started

### Prerequisites

Node.js (v18+) is required. Check if it's installed:
```bash
node -v   # should print v18.x or higher
npm -v
```

If not installed:
```bash
brew install node          # macOS via Homebrew
# or download from https://nodejs.org
```

### First-time setup

```bash
cd /Users/utepe/Repos/CSE593-HCI/Project
npm install
```

This installs all dependencies into `node_modules/`. Only needed once (or after pulling changes that modify `package.json`).

### Running locally

```bash
npm run dev
```

Opens a dev server at `http://localhost:5173` with hot-reload. The first thing you see is the sign-in screen — enter any name and project title to enter the workspace.

**To enable AI features**, click the ⚙ gear icon (top-right) and paste an Anthropic API key (`sk-ant-…`). The key is saved to browser localStorage and never leaves the browser except in direct calls to `api.anthropic.com`.

### Other commands

```bash
npm run build     # type-check + compile to dist/
npm run preview   # serve the dist/ build at http://localhost:4173
```

## Project Structure

```
Project/
├── index.html
├── package.json
├── vite.config.ts
├── tailwind.config.js
└── src/
    ├── App.tsx                     ← root: SignInPage or WorkspacePage
    ├── types.ts                    ← all shared TypeScript types
    ← store.ts                      ← zustand store (all app state + actions)
    ├── services/
    │   └── ai.ts                   ← Anthropic API calls (chat, PDF, audit)
    └── components/
        ├── SignInPage.tsx
        ├── WorkspacePage.tsx       ← flex layout: Sidebar + TopBar + Canvas
        ├── TopBar.tsx              ← project name, requirements toggle, settings
        ├── Sidebar.tsx             ← 5 action buttons to add windows
        ├── Canvas.tsx              ← 4000×3000 dot-grid; renders all windows
        ├── Window.tsx              ← draggable/resizable wrapper for all window types
        ├── ProjectRequirementsModal.tsx
        ├── SettingsModal.tsx
        └── windows/
            ├── ChatWindow.tsx
            ├── NotesWindow.tsx
            ├── PdfWindow.tsx
            ├── ChecklistWindow.tsx
            ├── ReferencesWindow.tsx
            └── AuditorWindow.tsx
```

## Architecture

**State** (`src/store.ts`): Single zustand store with `persist` middleware. Persists to `localStorage` under key `research-partner-v1`. PDF base64 blobs are explicitly excluded from persistence to avoid storage limits. All window positions, messages, notes content, checklist items, and references survive page reload.

**Window system** (`Window.tsx`): All six window types are wrapped in a common `Window` component that handles drag (title-bar mousedown + document mousemove/mouseup delta), resize (bottom-right handle, min 260×180), z-index bring-to-front, and close. Each window type gets a distinct accent color defined in the `ACCENT` map.

**AI service** (`src/services/ai.ts`): Direct browser calls to `https://api.anthropic.com/v1/messages` using the `anthropic-dangerous-direct-browser-access: true` header. Three exported functions:
- `sendChat` — streaming chat with project requirements injected as system prompt
- `summarizePdf` — sends PDF as a base64 document block, streams summary
- `auditResponse` — non-streaming second-opinion evaluation of an AI response

**Streaming**: SSE response body is read with `ReadableStream.getReader()`. `content_block_delta` events with `text_delta` are appended to the last message via `appendMsg` in the store.

**Canvas**: A single 4000×3000px `position: relative` div inside a scrollable container. Windows are `position: absolute` children with `left/top` driven by store state. No canvas panning library — just browser native scroll.

## Window Types & Features

| Type | Sidebar button | Key behavior |
|------|---------------|--------------|
| `chat` | 💬 New Chat | Streaming AI chat; "Save to Notes", "Audit", "Edit" actions per message |
| `notes` | 📝 New Notes | Textarea; word count; copy-all; receives content from "Save to Notes" |
| `pdf` | 📄 Upload PDF | FileReader → base64 → Claude document API summary; inline Q&A spawns new chat |
| `checklist` | ☑ Checklist | Progress bar; Enter to add item; Backspace on empty item removes it |
| `references` | 🔗 References | Global list (not per-window); add title + URL; numbered with external links |
| `auditor` | (spawned from chat) | Auto-runs on mount; calls `auditResponse`; re-run button |

## Key Design Decisions

- **Project requirements** are stored in the store and prepended as a system prompt to every `sendChat` call — users set them once and they persist across all chats automatically (addresses user requirement #11 from the paper).
- **Response Auditor** opens adjacent to the source chat window (`pos.x + size.width + 20`). It fires automatically on mount using a `useEffect` with an empty dep array.
- **"Save to Notes"** finds the first existing notes window and appends with a `---` separator, or creates a new notes window if none exists.
- **PDF Q&A** opens a new chat window pre-seeded with the PDF summary as context rather than re-sending the full base64 blob — avoids token bloat on follow-up questions.
- **Mock mode**: when no API key is set, all AI actions return an instructional message instead of crashing. The top bar shows a warning badge.

## Paper Document (LaTeX)

The research paper lives in the sibling directory:

```bash
cd ../CSE593_HCI_Winter_2026_Group_Project_Document_Group10

latexmk -pdf assignment_draft.tex   # full build
latexmk -c                           # clean artifacts
```

Uses ACM `acmlarge,screen,nonacm` class. The `\instructions{...}` macro renders text in red — these are unfilled template sections still to be written (Simplified User Testing, Final Design, User Evaluation).

## Research Context

**Problem:** Linear GenAI chat interfaces bury context, lose constraints, and force users to manage 2–5+ tabs per project.

**Solution (this prototype):** Canvas workspace where AI responses are movable, resizable nodes. Persistent project requirements eliminate constraint re-specification. Spatial layout enables side-by-side viewing of chats, notes, PDFs, and checklists without tab switching.

**15 user requirements** were derived from survey (n=24) + contextual inquiry (n=4). The prototype directly addresses: constraint persistence (#11), output retrieval (#8, #9), source citation (#1), audit trail (#12), multimodal input (#10), note-taking alongside AI (#15), and multi-workspace management (#13).
