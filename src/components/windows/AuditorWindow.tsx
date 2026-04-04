import { useEffect } from 'react'
import { RefreshCw, ShieldCheck } from 'lucide-react'
import { useStore } from '../../store'
import { auditResponse } from '../../services/ai'
import Window from '../Window'

export default function AuditorWindow({ wid }: { wid: string }) {
  const win          = useStore(s => s.windows.find(w => w.id === wid))
  const updateWindow = useStore(s => s.updateWindow)
  const apiKey       = useStore(s => s.apiKey)

  const runAudit = async () => {
    if (!win?.auditContent) return
    updateWindow(wid, { auditLoading: true, auditResult: '' })

    if (!apiKey) {
      updateWindow(wid, {
        auditLoading: false,
        auditResult: 'Configure an API key in Settings to run the response auditor.',
      })
      return
    }

    try {
      const result = await auditResponse(win.auditQuery ?? '', win.auditContent, apiKey)
      updateWindow(wid, { auditResult: result, auditLoading: false })
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

  return (
    <Window id={wid} title="Response Auditor">
      <div className="p-4 h-full overflow-y-auto flex flex-col gap-4">
        {/* Original response */}
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
              A second AI model is evaluating the accuracy and completeness of this response.
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
              <button
                onClick={runAudit}
                className="text-xs text-gray-400 hover:text-purple-600 flex items-center gap-1 transition-colors"
              >
                <RefreshCw size={11} /> Re-run
              </button>
            </div>
            <div className="text-sm text-gray-700 bg-purple-50 rounded-xl p-3 border border-purple-100 whitespace-pre-wrap leading-relaxed">
              {win.auditResult}
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

        {/* Manual trigger if not started */}
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
