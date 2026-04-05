import { useState } from 'react'
import { SlidersHorizontal } from 'lucide-react'
import { useStore } from '../store'

export default function ProjectRequirementsModal({ onClose }: { onClose: () => void }) {
  const { requirements, setRequirements } = useStore()
  const [value, setValue] = useState(requirements)

  const EXAMPLES = [
    'Use peer-reviewed sources only.',
    'APA 7th edition citation format.',
    'Target audience: clinical researchers.',
    'Keep responses under 300 words.',
  ]

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center p-4" style={{ zIndex: 99999 }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-[520px] flex flex-col max-h-[90vh]">
        <div className="flex items-center gap-2 mb-1">
          <SlidersHorizontal size={18} className="text-indigo-600" />
          <h2 className="text-base font-bold text-gray-900">Project Requirements</h2>
        </div>
        <p className="text-sm text-gray-500 mb-4">
          These constraints are automatically prepended to every AI request in this project —
          no need to repeat them in each chat.
        </p>

        <textarea
          className="border border-gray-200 rounded-xl p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-200 font-mono leading-relaxed min-h-[180px] flex-1"
          placeholder={`e.g.:\n${EXAMPLES.join('\n')}`}
          value={value}
          onChange={e => setValue(e.target.value)}
          autoFocus
        />

        {/* Quick-add chips */}
        <div className="mt-3 flex flex-wrap gap-1.5">
          {EXAMPLES.map(ex => (
            <button
              key={ex}
              onClick={() => setValue(v => v ? v + '\n' + ex : ex)}
              className="text-xs bg-indigo-50 text-indigo-600 px-2 py-1 rounded-lg hover:bg-indigo-100 transition-colors"
            >
              + {ex}
            </button>
          ))}
        </div>

        <div className="flex gap-3 mt-5">
          <button
            className="flex-1 py-2.5 text-sm bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors font-semibold"
            onClick={() => { setRequirements(value); onClose() }}
          >
            Save Requirements
          </button>
          <button
            className="px-5 py-2.5 text-sm text-gray-600 rounded-xl hover:bg-gray-100 transition-colors"
            onClick={onClose}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
