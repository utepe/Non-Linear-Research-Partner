import { useState, useEffect } from 'react'
import { Settings, Eye, EyeOff, ExternalLink, RefreshCw } from 'lucide-react'
import { useStore } from '../store'
import {
  FALLBACK_MODELS,
  DEFAULT_CHAT_MODEL,
  DEFAULT_AUDITOR_MODEL,
  fetchFreeModels,
  type ModelOption,
} from '../models'

interface ModelSelectProps {
  label: string
  hint: string
  value: string
  onChange: (v: string) => void
  models: ModelOption[]
  badge?: string
}

function ModelSelect({ label, hint, value, onChange, models, badge }: ModelSelectProps) {
  const isCustom = value !== '' && !models.find(m => m.id === value)
  const [showCustom, setShowCustom] = useState(isCustom)

  const handleChange = (v: string) => {
    if (v === '__custom__') {
      setShowCustom(true)
      onChange('')
    } else {
      setShowCustom(false)
      onChange(v)
    }
  }

  const selected = models.find(m => m.id === value)

  return (
    <div>
      <div className="flex items-center gap-2 mb-1.5">
        <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">{label}</label>
        {badge && (
          <span className="text-xs bg-purple-100 text-purple-600 px-1.5 py-0.5 rounded-full font-medium">
            {badge}
          </span>
        )}
      </div>

      <select
        value={showCustom ? '__custom__' : value}
        onChange={e => handleChange(e.target.value)}
        className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 bg-white transition"
      >
        {models.map(m => (
          <option key={m.id} value={m.id}>
            {m.isFree ? '✦ ' : ''}{m.name} — {m.provider} · {m.contextLabel} ctx{m.isFree ? ' (free)' : ''}
          </option>
        ))}
        <option disabled>────────────</option>
        <option value="__custom__">Custom model ID…</option>
      </select>

      {showCustom && (
        <input
          type="text"
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder="e.g. meta-llama/llama-3.3-70b-instruct:free"
          className="mt-2 w-full border border-indigo-200 rounded-xl px-3 py-2 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-indigo-200 transition"
          autoFocus
        />
      )}

      {selected && !showCustom && selected.description && (
        <p className="text-xs text-gray-400 mt-1 leading-snug line-clamp-2">{selected.description}</p>
      )}

      <p className="text-xs text-gray-400 mt-0.5">{hint}</p>
    </div>
  )
}

export default function SettingsModal({ onClose }: { onClose: () => void }) {
  const { apiKey, setApiKey, chatModel, setChatModel, auditorModel, setAuditorModel } = useStore()

  const [keyValue, setKeyValue] = useState(apiKey)
  const [show, setShow]         = useState(false)
  const [chat, setChat]         = useState(chatModel || DEFAULT_CHAT_MODEL)
  const [auditor, setAuditor]   = useState(auditorModel || DEFAULT_AUDITOR_MODEL)

  const [models, setModels]       = useState<ModelOption[]>(FALLBACK_MODELS)
  const [loadingModels, setLoading] = useState(false)
  const [modelError, setModelError] = useState('')

  const loadModels = async () => {
    setLoading(true)
    setModelError('')
    try {
      const list = await fetchFreeModels()
      if (list.length > 0) setModels(list)
      else setModelError('No free models returned — showing fallback list.')
    } catch {
      setModelError('Could not load model list. Showing known free models.')
    } finally {
      setLoading(false)
    }
  }

  // Fetch on open
  useEffect(() => { loadModels() }, [])

  const save = () => {
    setApiKey(keyValue.trim())
    setChatModel(chat)
    setAuditorModel(auditor)
    onClose()
  }

  const sameModel = chat && auditor && chat === auditor

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center p-4" style={{ zIndex: 99999 }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-[500px] flex flex-col max-h-[92vh] overflow-y-auto">
        <div className="flex items-center gap-2 mb-1">
          <Settings size={18} className="text-gray-600" />
          <h2 className="text-base font-bold text-gray-900">Settings</h2>
        </div>
        <p className="text-sm text-gray-500 mb-5">
          Configure your OpenRouter API key and choose AI models. Model list is fetched live from{' '}
          <a
            href="https://openrouter.ai/models?q=free"
            target="_blank"
            rel="noopener noreferrer"
            className="text-indigo-500 hover:underline"
          >
            openrouter.ai
          </a>.
        </p>

        <div className="space-y-5">
          {/* API Key */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                OpenRouter API Key
              </label>
              <a
                href="https://openrouter.ai/keys"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-indigo-500 hover:text-indigo-700 flex items-center gap-0.5 transition-colors"
              >
                Get free key <ExternalLink size={10} />
              </a>
            </div>
            <div className="relative">
              <input
                type={show ? 'text' : 'password'}
                value={keyValue}
                onChange={e => setKeyValue(e.target.value)}
                placeholder="sk-or-v1-…"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 pr-10 font-mono transition"
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                onClick={() => setShow(s => !s)}
              >
                {show ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Stored in browser localStorage only. Free tier: no credit card needed.
            </p>
          </div>

          {keyValue && (
            <div className="flex items-center gap-2 bg-green-50 border border-green-100 rounded-xl px-3 py-2">
              <div className="w-2 h-2 rounded-full bg-green-500 shrink-0" />
              <span className="text-xs text-green-700">API key configured — AI features enabled</span>
            </div>
          )}

          {/* Model pickers */}
          <div className="border-t border-gray-100 pt-4 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Model Selection
                {loadingModels && (
                  <span className="ml-2 text-indigo-400 font-normal normal-case">Loading…</span>
                )}
                {!loadingModels && models.length > 0 && (
                  <span className="ml-2 text-gray-400 font-normal normal-case">
                    {models.length} models ({models.filter(m => m.isFree).length} free)
                  </span>
                )}
              </p>
              <button
                onClick={loadModels}
                disabled={loadingModels}
                className="text-xs text-indigo-500 hover:text-indigo-700 flex items-center gap-1 transition-colors disabled:opacity-40"
              >
                <RefreshCw size={11} className={loadingModels ? 'animate-spin' : ''} />
                Refresh
              </button>
            </div>

            {modelError && (
              <p className="text-xs text-amber-600 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                {modelError}
              </p>
            )}

            <ModelSelect
              label="Chat Model"
              hint="Used for all research chats and PDF Q&A."
              value={chat}
              onChange={setChat}
              models={models}
            />

            <ModelSelect
              label="Auditor Model"
              hint="Independently evaluates chat responses. Best when different from chat model."
              value={auditor}
              onChange={setAuditor}
              models={models}
              badge="Independent"
            />

            {sameModel && (
              <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                <span className="text-amber-500 mt-0.5 shrink-0">⚠</span>
                <p className="text-xs text-amber-700">
                  Both models are the same. For genuine independent verification, pick a different model for the auditor.
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            className="flex-1 py-2.5 text-sm bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors font-semibold"
            onClick={save}
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
