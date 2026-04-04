# Research Partner — Non-Linear AI Workspace

A high-fidelity prototype built for **CSE 593: Human-Computer Interaction** (Winter 2026, Group 10) at the University of Michigan.

**Team:** Maaz Hussain · Anand Parikh · Uygur Tepe · Xiaochi Yang

---

## What it is

Research Partner is a canvas-based AI workspace that replaces the standard linear chat interface with a spatial, multi-window environment. Users can drag, resize, and arrange chat windows, notes, PDFs, checklists, and references freely on an infinite canvas — keeping everything visible at once without switching tabs.

It directly implements the design findings from our survey (n=24) and contextual inquiry (n=4), which showed that researchers open 2–5+ separate chat windows per project, manually copy AI outputs into external documents, and constantly re-state constraints that the AI forgets.

---

## Setup

**Prerequisites:** Node.js v18 or higher.

```bash
# Check Node version
node -v

# Install if needed (macOS)
brew install node
```

**Install and run:**

```bash
cd Project/
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## First-time use

1. **Sign in** — enter your name and a project title (no account needed; data is local)
2. **Set your API key** — click the ⚙ gear icon (top-right) and paste an Anthropic API key (`sk-ant-…`) to enable AI features
3. **Set project requirements** — click "Set requirements" in the top bar to define constraints that apply to every AI interaction automatically (e.g. citation format, audience, scope)
4. **Add windows** — use the left sidebar to add chats, notes, PDFs, and more

---

## Features

### Canvas Workspace
- Freely drag and reposition any window on the canvas
- Resize windows from the bottom-right corner
- Scroll the canvas to use more space
- All window positions and content persist across page reloads (localStorage)

### Chat Windows
- Streaming AI responses via the Anthropic API (claude-opus-4-6)
- Project requirements automatically applied to every message — no need to repeat yourself
- **Save to Notes** — copies any AI response directly into a notes window
- **Audit Response** — opens a Response Auditor that runs an independent evaluation of the AI's answer
- **Edit Response** — click the pencil icon to correct or annotate any AI message in place

### Notes Windows
- Freeform text editor alongside your AI chats
- Word count shown in the footer
- Copy-all button for easy export
- Content from "Save to Notes" is appended with a separator

### PDF Upload & Summarization
- Upload any PDF from your file system
- Automatically summarized by Claude using the document API
- Ask questions about the PDF — opens a new pre-seeded chat window
- Regenerate summary at any time

### Checklist
- Track research tasks with checkboxes
- Progress bar shows completion at a glance
- Press Enter to add a new item, Backspace on an empty item to remove it

### References
- Shared citation list across your entire session
- Add a title and optional URL for each source
- Numbered list with clickable external links

### Response Auditor
- Triggered from any AI message via the "Audit" button
- Runs a second independent Claude call to evaluate: factual accuracy, completeness, confidence level, and what to verify independently
- Addresses the trust and verification requirements identified in our user research

### Project Requirements
- Defined once per session in the top bar
- Automatically injected as a system prompt into every chat — constraints never get "forgotten" by the AI
- Quick-add chips for common research constraints

---

## Tech Stack

| Layer | Choice |
|-------|--------|
| Framework | React 18 + TypeScript |
| Build tool | Vite |
| Styling | Tailwind CSS |
| State | Zustand (with localStorage persistence) |
| Icons | Lucide React |
| AI | Anthropic API — direct browser calls |

---

## Project Requirements Traceability

The prototype was designed against 15 user requirements derived from our research. Key ones addressed:

| Requirement | Feature |
|-------------|---------|
| #1 — Source citations | Inline citation prompt in every chat |
| #8 — Save outputs | "Save to Notes" on every AI message |
| #9 — Retrieve saved outputs | Notes windows, persistent across reload |
| #10 — Multimodal input | PDF upload → Claude document API |
| #11 — Persistent constraints | Project Requirements modal, injected as system prompt |
| #12 — Audit trail | Response Auditor window |
| #13 — Multiple workspaces | Each sign-in session is its own project |
| #14 — Search long conversations | Per-window scrollable chat history |
| #15 — Notes alongside AI | Notes windows freely positioned next to chats |

---

## Research Paper

The accompanying research paper (LaTeX) is in the sibling directory:

```
../CSE593_HCI_Winter_2026_Group_Project_Document_Group10/assignment_draft.tex
```

Build with:
```bash
cd ../CSE593_HCI_Winter_2026_Group_Project_Document_Group10
latexmk -pdf assignment_draft.tex
```
