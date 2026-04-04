import { useState } from 'react'
import { useStore } from '../store'

export default function SignInPage() {
  const signIn = useStore(s => s.signIn)
  const [name, setName] = useState('')
  const [project, setProject] = useState('')

  const canSubmit = name.trim().length > 0 && project.trim().length > 0

  const handleSubmit = () => {
    if (!canSubmit) return
    signIn(name.trim(), project.trim())
  }

  return (
    <div className="h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-indigo-50 to-blue-100">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-[420px] border border-indigo-100">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <span className="text-white text-2xl font-bold">NR</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Research Partner</h1>
          <p className="text-gray-500 text-sm mt-1">Your non-linear AI research workspace</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5 block">
              Your Name
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Dr. Greg Thomas"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-transparent transition"
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5 block">
              Research Project
            </label>
            <input
              type="text"
              value={project}
              onChange={e => setProject(e.target.value)}
              placeholder="Gastrointestinal Research Study"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-transparent transition"
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            />
          </div>

          <button
            disabled={!canSubmit}
            onClick={handleSubmit}
            className="w-full py-3 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-md mt-2"
          >
            Start Research Session →
          </button>

          <p className="text-xs text-center text-gray-400 pt-1">
            Your session is saved locally. Configure your API key after sign-in.
          </p>
        </div>
      </div>
    </div>
  )
}
