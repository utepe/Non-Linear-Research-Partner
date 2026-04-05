import { useState } from 'react'
import { Settings, LogOut, SlidersHorizontal } from 'lucide-react'
import { useStore } from '../store'
import ProjectRequirementsModal from './ProjectRequirementsModal'
import SettingsModal from './SettingsModal'

export default function TopBar() {
  const { userName, projectName, requirements, apiKey, signOut } = useStore()
  const [showReqs, setShowReqs] = useState(false)
  const [showSettings, setShowSettings] = useState(false)

  const hasRequirements = requirements.trim().length > 0
  const hasApiKey = apiKey.trim().length > 0

  return (
    <>
      <div className="h-12 bg-white border-b border-gray-200 flex items-center px-4 gap-3 shrink-0 shadow-sm">
        {/* Project name */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="w-2 h-2 rounded-full bg-indigo-500 shrink-0" />
          <span className="text-sm font-semibold text-gray-800 truncate">{projectName}</span>
        </div>

        {/* Requirements badge */}
        <button
          onClick={() => setShowReqs(true)}
          className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
            hasRequirements
              ? 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
              : 'bg-gray-50 text-gray-500 hover:bg-gray-100 border border-dashed border-gray-300'
          }`}
        >
          <SlidersHorizontal size={12} />
          {hasRequirements ? 'Requirements active' : 'Set requirements'}
        </button>

        {/* API key warning */}
        {!hasApiKey && (
          <button
            onClick={() => setShowSettings(true)}
            className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded-lg hover:bg-amber-100 transition-colors"
          >
            ⚠ No OpenRouter key
          </button>
        )}

        <span className="text-xs text-gray-400 hidden sm:block">{userName}</span>

        <button
          onClick={() => setShowSettings(true)}
          className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors"
          title="Settings"
        >
          <Settings size={16} />
        </button>

        <button
          onClick={signOut}
          className="text-gray-400 hover:text-red-500 p-1 rounded-lg hover:bg-red-50 transition-colors"
          title="Sign out"
        >
          <LogOut size={16} />
        </button>
      </div>

      {showReqs && <ProjectRequirementsModal onClose={() => setShowReqs(false)} />}
      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
    </>
  )
}
