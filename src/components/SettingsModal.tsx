import { useState } from 'react'
import { Settings, Eye, EyeOff } from 'lucide-react'
import { useStore } from '../store'

export default function SettingsModal({ onClose }: { onClose: () => void }) {
  const { apiKey, setApiKey } = useStore()
  const [value, setValue]     = useState(apiKey)
  const [show, setShow]       = useState(false)

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-[420px]">
        <div className="flex items-center gap-2 mb-1">
          <Settings size={18} className="text-gray-600" />
          <h2 className="text-base font-bold text-gray-900">Settings</h2>
        </div>
        <p className="text-sm text-gray-500 mb-5">
          Configure your Anthropic API key to enable AI features — chat, PDF summaries,
          and response auditing.
        </p>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5 block">
              Anthropic API Key
            </label>
            <div className="relative">
              <input
                type={show ? 'text' : 'password'}
                value={value}
                onChange={e => setValue(e.target.value)}
                placeholder="sk-ant-api03-…"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 pr-10 font-mono"
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                onClick={() => setShow(s => !s)}
              >
                {show ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-1.5">
              Stored in your browser's local storage. Never sent to any server other than Anthropic.
            </p>
          </div>

          {value && (
            <div className="flex items-center gap-2 bg-green-50 border border-green-100 rounded-xl px-3 py-2">
              <div className="w-2 h-2 rounded-full bg-green-500 shrink-0" />
              <span className="text-xs text-green-700">API key configured — AI features enabled</span>
            </div>
          )}
        </div>

        <div className="flex gap-3 mt-5">
          <button
            className="flex-1 py-2.5 text-sm bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors font-semibold"
            onClick={() => { setApiKey(value.trim()); onClose() }}
          >
            Save Settings
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
