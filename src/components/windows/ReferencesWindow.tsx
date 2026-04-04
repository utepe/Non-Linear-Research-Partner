import { useState } from 'react'
import { Plus, Trash2, ExternalLink } from 'lucide-react'
import { useStore } from '../../store'
import Window from '../Window'

export default function ReferencesWindow({ wid }: { wid: string }) {
  const refs      = useStore(s => s.refs)
  const addRef    = useStore(s => s.addRef)
  const removeRef = useStore(s => s.removeRef)

  const [title, setTitle]   = useState('')
  const [url, setUrl]       = useState('')
  const [adding, setAdding] = useState(false)

  const handleAdd = () => {
    if (!title.trim()) return
    addRef(title.trim(), url.trim())
    setTitle('')
    setUrl('')
    setAdding(false)
  }

  const windowTitle = `References${refs.length > 0 ? ` — ${refs.length}` : ''}`

  return (
    <Window id={wid} title={windowTitle}>
      <div className="flex flex-col h-full p-3">
        {/* List */}
        <div className="flex-1 overflow-y-auto space-y-2">
          {refs.length === 0 && (
            <div className="text-center py-6">
              <div className="text-2xl mb-2">📚</div>
              <p className="text-sm text-gray-400">No references yet.</p>
              <p className="text-xs text-gray-400 mt-1">Add sources to track during your research.</p>
            </div>
          )}
          {refs.map((ref, i) => (
            <div
              key={ref.id}
              className="flex items-start gap-2 p-2.5 bg-blue-50 rounded-xl border border-blue-100 group"
            >
              <span className="text-xs font-bold text-blue-400 shrink-0 mt-0.5 w-5 text-right">
                {i + 1}.
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-blue-900 leading-snug">{ref.title}</p>
                {ref.url && (
                  <a
                    href={ref.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-500 hover:text-blue-700 hover:underline truncate flex items-center gap-1 mt-0.5"
                  >
                    <ExternalLink size={10} />
                    {ref.url.length > 45 ? ref.url.slice(0, 45) + '…' : ref.url}
                  </a>
                )}
              </div>
              <button
                className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-400 transition-all shrink-0"
                onClick={() => removeRef(ref.id)}
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>

        {/* Add reference form */}
        {adding ? (
          <div className="mt-3 border-t border-gray-100 pt-3 space-y-2">
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Reference title or citation"
              className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200 transition"
              autoFocus
              onKeyDown={e => e.key === 'Enter' && handleAdd()}
            />
            <input
              type="url"
              value={url}
              onChange={e => setUrl(e.target.value)}
              placeholder="URL (optional)"
              className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200 transition"
              onKeyDown={e => e.key === 'Enter' && handleAdd()}
            />
            <div className="flex gap-2">
              <button
                onClick={handleAdd}
                disabled={!title.trim()}
                className="flex-1 py-2 text-sm bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-40 transition-colors"
              >
                Save Reference
              </button>
              <button
                onClick={() => setAdding(false)}
                className="px-4 py-2 text-sm text-gray-500 rounded-xl hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setAdding(true)}
            className="mt-3 flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 font-medium border border-blue-200 rounded-xl py-2 px-3 hover:bg-blue-50 transition-colors w-full justify-center"
          >
            <Plus size={14} /> Add reference
          </button>
        )}
      </div>
    </Window>
  )
}
