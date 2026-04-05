import { useEffect, useState } from 'react'
import { RefreshCw, ShieldCheck, BookmarkPlus } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { useStore } from '../../store'
import { auditResponse } from '../../services/ai'
import { FALLBACK_MODELS, fetchFreeModels, type ModelOption } from '../../models'
import Window from '../Window'

export default function AuditorWindow({ wid }: { wid: string }) {
  const win          = useStore(s => s.windows.find(w => w.id === wid))
  const updateWindow = useStore(s => s.updateWindow)
  const apiKey       = useStore(s => s.apiKey)
  const auditorModel    = useStore(s => s.auditorModel)
  const setAuditorModel = useStore(s => s.setAuditorModel)
  const windows         = useStore(s => s.windows)
  const addWindow       = useStore(s => s.addWindow)

  const [models, setModels] = useState<ModelOption[]>(FALLBACK_MODELS)

  useEffect(() => {
    fetchFreeModels().then(list => { if (list.length > 0) setModels(list) }).catch(() => {})
  }, [])

  const saveToNotes = (content: string) => {
    const notesWin = windows.find(w => w.type === 'notes')
    if (notesWin) {
      updateWindow(notesWin.id, {
        noteText: (notesWin.noteText ?? '') + '\n\n---\n' + content,
        notePreview: true,
      })
    } else {
      addWindow('notes', { noteText: content, notePreview: true })
    }
  }

  const runAudit = async () => {
    if (!win?.auditContent) return
    updateWindow(wid, { auditLoading: true, auditResult: '' })

    if (!apiKey) {
      updateWindow(wid, {
        auditLoading: false,
        auditResult: 'Configure an OpenRouter API key in Settings to run the response auditor.',
      })
      return
    }

    try {
      const primaryModel = win.auditPrimaryModel ?? 'unknown'
      let accumulated = ''
      await auditResponse(
        win.auditQuery ?? '',
        win.auditContent,
        primaryModel,
        apiKey,
        auditorModel,
        chunk => {
          accumulated += chunk
          updateWindow(wid, { auditResult: accumulated })
        },
      )
      updateWindow(wid, { auditLoading: false })
    } catch (err) {
      updateWindow(wid, {
        auditResult: `Audit error: ${(err as Error).message}`,
        auditLoading: false,
      })
    }
  }

  // Auto-run on mount if content is ready and not yet audited
  useEffect(() => {
    if (win?.auditContent && !win.auditResult && !win.auditLoading) {
      runAudit()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!win) return null

  const slugToName = (id: string) =>
    id.split('/').pop()?.replace(':free', '').replace(/-/g, ' ') ?? id

  const primaryModelName = win.auditPrimaryModel ? slugToName(win.auditPrimaryModel) : null
  const auditorModelName = slugToName(auditorModel)
  const sameModel = win.auditPrimaryModel === auditorModel

  return (
    <Window id={wid} title="Response Auditor">
      <div className="p-4 h-full overflow-y-auto flex flex-col gap-4">

        {/* Model badges + auditor selector */}
        {win.auditContent && (
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap gap-2 items-center">
              {primaryModelName && (
                <span className="text-xs bg-indigo-50 text-indigo-600 px-2 py-1 rounded-lg border border-indigo-100">
                  Chat: {primaryModelName}
                </span>
              )}
              {sameModel && (
                <span className="text-xs bg-amber-50 text-amber-600 px-2 py-1 rounded-lg border border-amber-100">
                  ⚠ Same model
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-purple-600 shrink-0">Auditor:</span>
              <select
                value={auditorModel}
                onChange={e => { setAuditorModel(e.target.value); updateWindow(wid, { auditResult: '', auditLoading: false }) }}
                className="flex-1 text-xs border border-purple-200 rounded-lg px-2 py-1 bg-purple-50 text-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-200 transition"
              >
                {models.map(m => (
                  <option key={m.id} value={m.id}>{m.name} — {m.provider}</option>
                ))}
                {!FALLBACK_MODELS.find(m => m.id === auditorModel) && (
                  <option value={auditorModel}>{auditorModelName}</option>
                )}
              </select>
              <button
                onClick={runAudit}
                disabled={!!win.auditLoading}
                className="text-xs text-purple-500 hover:text-purple-700 disabled:opacity-40 transition-colors shrink-0"
                title="Re-run with selected model"
              >
                <RefreshCw size={12} className={win.auditLoading ? 'animate-spin' : ''} />
              </button>
            </div>
          </div>
        )}

        {/* Original response preview */}
        {win.auditContent && (
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
              Original Response
            </p>
            <div className="text-sm text-gray-600 bg-gray-50 rounded-xl p-3 max-h-28 overflow-y-auto leading-relaxed border border-gray-100">
              {win.auditQuery && (
                <p className="text-xs text-indigo-500 mb-1 font-medium">
                  Q: {win.auditQuery.slice(0, 80)}{win.auditQuery.length > 80 ? '…' : ''}
                </p>
              )}
              {win.auditContent.slice(0, 300)}{win.auditContent.length > 300 ? '…' : ''}
            </div>
          </div>
        )}

        {/* Loading state */}
        {win.auditLoading && (
          <div className="flex flex-col items-center gap-3 py-6">
            <div className="w-8 h-8 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-purple-600 font-medium">Running independent audit…</p>
            <p className="text-xs text-gray-400 text-center max-w-[240px]">
              {auditorModelName} is independently evaluating this response.
            </p>
          </div>
        )}

        {/* Audit result */}
        {win.auditResult && !win.auditLoading && (
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide flex items-center gap-1">
                <ShieldCheck size={12} className="text-purple-500" />
                Audit Results
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => saveToNotes(win.auditResult!)}
                  className="text-xs text-gray-400 hover:text-amber-600 flex items-center gap-1 transition-colors"
                  title="Save to notes"
                >
                  <BookmarkPlus size={11} /> Notes
                </button>
                <button
                  onClick={runAudit}
                  className="text-xs text-gray-400 hover:text-purple-600 flex items-center gap-1 transition-colors"
                >
                  <RefreshCw size={11} /> Re-run
                </button>
              </div>
            </div>
            <div className="text-sm text-gray-700 bg-purple-50 rounded-xl p-3 border border-purple-100 leading-relaxed">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  a: ({ href, children }) => (
                    <a href={href} target="_blank" rel="noopener noreferrer" className="underline text-purple-600 hover:text-purple-800 break-all">
                      {children}
                    </a>
                  ),
                  p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                  ul: ({ children }) => <ul className="list-disc pl-4 mb-2 space-y-0.5">{children}</ul>,
                  ol: ({ children }) => <ol className="list-decimal pl-4 mb-2 space-y-0.5">{children}</ol>,
                  li: ({ children }) => <li className="leading-relaxed">{children}</li>,
                  strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                  em: ({ children }) => <em className="italic">{children}</em>,
                  code: ({ children }) => <code className="bg-purple-100 text-purple-800 rounded px-1 py-0.5 text-xs font-mono">{children}</code>,
                  h1: ({ children }) => <h1 className="font-bold text-base mb-1">{children}</h1>,
                  h2: ({ children }) => <h2 className="font-bold text-sm mb-1">{children}</h2>,
                  h3: ({ children }) => <h3 className="font-semibold text-sm mb-1">{children}</h3>,
                }}
              >
                {win.auditResult}
              </ReactMarkdown>
            </div>
          </div>
        )}

        {/* No content state */}
        {!win.auditContent && (
          <div className="flex flex-col items-center gap-2 py-8 text-center">
            <ShieldCheck size={28} className="text-purple-300" />
            <p className="text-sm text-gray-400">No response to audit.</p>
            <p className="text-xs text-gray-400">
              Click "Audit" on any AI response in a chat window.
            </p>
          </div>
        )}

        {/* Manual trigger */}
        {win.auditContent && !win.auditResult && !win.auditLoading && (
          <button
            onClick={runAudit}
            className="w-full py-2.5 bg-purple-600 text-white rounded-xl text-sm font-medium hover:bg-purple-700 transition-colors"
          >
            Run Audit
          </button>
        )}
      </div>
    </Window>
  )
}
