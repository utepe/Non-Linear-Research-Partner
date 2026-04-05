import { useStore } from '../store'
import ChatWindow from './windows/ChatWindow'
import NotesWindow from './windows/NotesWindow'
import PdfWindow from './windows/PdfWindow'
import ChecklistWindow from './windows/ChecklistWindow'
import ReferencesWindow from './windows/ReferencesWindow'
import AuditorWindow from './windows/AuditorWindow'
import type { AppWindow } from '../types'

function renderWindow(win: AppWindow) {
  switch (win.type) {
    case 'chat':       return <ChatWindow       key={win.id} wid={win.id} />
    case 'notes':      return <NotesWindow      key={win.id} wid={win.id} />
    case 'pdf':        return <PdfWindow        key={win.id} wid={win.id} />
    case 'checklist':  return <ChecklistWindow  key={win.id} wid={win.id} />
    case 'references': return <ReferencesWindow key={win.id} wid={win.id} />
    case 'auditor':    return <AuditorWindow    key={win.id} wid={win.id} />
    default:           return null
  }
}

export default function Canvas() {
  const windows = useStore(s => s.windows)
  const projectName = useStore(s => s.projectName)

  return (
    <div className="flex-1 overflow-auto" style={{ background: '#F0F2F7' }}>
      {/* Dot-grid canvas */}
      <div
        className="relative"
        style={{
          width: 4000,
          height: 3000,
          backgroundImage: 'radial-gradient(circle, #C9D0E0 1.2px, transparent 1.2px)',
          backgroundSize: '28px 28px',
        }}
      >
        {/* Empty state hint */}
        {windows.length === 0 && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
            <div className="text-5xl mb-4">🗂️</div>
            <h2 className="text-lg font-semibold text-gray-400 mb-1">{projectName}</h2>
            <p className="text-sm text-gray-400">Use the sidebar to add chat windows, notes, PDFs, and more.</p>
          </div>
        )}

        {windows.map(renderWindow)}
      </div>
    </div>
  )
}
