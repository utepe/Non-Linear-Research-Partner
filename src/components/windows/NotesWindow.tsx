import { useStore } from '../../store'
import Window from '../Window'

export default function NotesWindow({ wid }: { wid: string }) {
  const win          = useStore(s => s.windows.find(w => w.id === wid))
  const updateWindow = useStore(s => s.updateWindow)

  if (!win) return null

  const wordCount = (win.noteText ?? '').split(/\s+/).filter(Boolean).length

  return (
    <Window id={wid} title={`Notes${wordCount > 0 ? ` — ${wordCount} words` : ''}`}>
      <div className="flex flex-col h-full">
        <textarea
          className="flex-1 w-full p-3 text-sm resize-none focus:outline-none leading-relaxed text-gray-700 placeholder-gray-300 font-mono"
          placeholder="Type your research notes here…&#10;&#10;Tip: Use the 'Save to notes' button on any AI response to collect insights."
          value={win.noteText ?? ''}
          onChange={e => updateWindow(wid, { noteText: e.target.value })}
        />
        <div className="border-t border-amber-100 px-3 py-1.5 bg-amber-50 flex justify-between items-center">
          <span className="text-xs text-amber-500">{wordCount} words</span>
          <button
            className="text-xs text-amber-500 hover:text-amber-700 transition-colors"
            onClick={() => {
              if (win.noteText) {
                navigator.clipboard.writeText(win.noteText).catch(() => {})
              }
            }}
          >
            Copy all
          </button>
        </div>
      </div>
    </Window>
  )
}
