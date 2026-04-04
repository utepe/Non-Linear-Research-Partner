import { useRef } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { useStore } from '../../store'
import Window from '../Window'

export default function ChecklistWindow({ wid }: { wid: string }) {
  const win        = useStore(s => s.windows.find(w => w.id === wid))
  const addItem    = useStore(s => s.addItem)
  const toggleItem = useStore(s => s.toggleItem)
  const editItem   = useStore(s => s.editItem)
  const removeItem = useStore(s => s.removeItem)
  const newItemRef = useRef<HTMLInputElement>(null)

  if (!win) return null

  const items = win.items ?? []
  const doneCount = items.filter(i => i.done).length
  const title = `Checklist${items.length > 0 ? ` — ${doneCount}/${items.length}` : ''}`

  const handleAdd = () => {
    addItem(wid)
    setTimeout(() => {
      const inputs = newItemRef.current?.closest('[data-checklist]')?.querySelectorAll('input[type="text"]')
      if (inputs) (inputs[inputs.length - 1] as HTMLInputElement)?.focus()
    }, 50)
  }

  return (
    <Window id={wid} title={title}>
      <div className="flex flex-col h-full p-3" data-checklist="true">
        {/* Progress bar */}
        {items.length > 0 && (
          <div className="mb-3 h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500 rounded-full transition-all duration-300"
              style={{ width: `${items.length ? (doneCount / items.length) * 100 : 0}%` }}
            />
          </div>
        )}

        {/* Items */}
        <div className="flex-1 overflow-y-auto space-y-1.5">
          {items.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-6">No tasks yet. Add one below.</p>
          )}
          {items.map(item => (
            <div
              key={item.id}
              className={`flex items-center gap-2 p-1.5 rounded-lg transition-colors group ${
                item.done ? 'bg-green-50' : 'hover:bg-gray-50'
              }`}
            >
              <input
                type="checkbox"
                checked={item.done}
                onChange={() => toggleItem(wid, item.id)}
                className="w-4 h-4 accent-green-600 cursor-pointer shrink-0 rounded"
              />
              <input
                type="text"
                value={item.text}
                onChange={e => editItem(wid, item.id, e.target.value)}
                placeholder="Task description…"
                className={`flex-1 text-sm bg-transparent border-0 focus:outline-none ${
                  item.done ? 'line-through text-gray-400' : 'text-gray-700'
                }`}
                onKeyDown={e => {
                  if (e.key === 'Enter') handleAdd()
                  if (e.key === 'Backspace' && !item.text) removeItem(wid, item.id)
                }}
              />
              <button
                className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-400 transition-all shrink-0"
                onClick={() => removeItem(wid, item.id)}
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>

        {/* Add button */}
        <button
          ref={newItemRef}
          onClick={handleAdd}
          className="mt-3 flex items-center gap-1.5 text-sm text-green-600 hover:text-green-700 font-medium border border-green-200 rounded-xl py-2 px-3 hover:bg-green-50 transition-colors w-full justify-center"
        >
          <Plus size={14} /> Add task
        </button>
      </div>
    </Window>
  )
}
