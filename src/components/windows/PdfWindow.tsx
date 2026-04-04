import { useState } from 'react'
import { FileText, MessageSquare } from 'lucide-react'
import { useStore } from '../../store'
import { summarizePdf } from '../../services/ai'
import Window from '../Window'

export default function PdfWindow({ wid }: { wid: string }) {
  const win          = useStore(s => s.windows.find(w => w.id === wid))
  const updateWindow = useStore(s => s.updateWindow)
  const addWindow    = useStore(s => s.addWindow)
  const apiKey       = useStore(s => s.apiKey)
  const requirements = useStore(s => s.requirements)

  const [question, setQuestion] = useState('')
  const [asking, setAsking] = useState(false)
  const [answer, setAnswer] = useState('')

  if (!win) return null

  const name = win.pdfName ?? 'Document'
  const title = `PDF — ${name.length > 22 ? name.slice(0, 22) + '…' : name}`

  const regenerate = async () => {
    if (!win.pdfBase64 || !apiKey) return
    updateWindow(wid, { pdfLoading: true, pdfSummary: '' })
    try {
      let s = ''
      await summarizePdf(win.pdfBase64, apiKey, chunk => {
        s += chunk
        updateWindow(wid, { pdfSummary: s })
      })
      updateWindow(wid, { pdfLoading: false })
    } catch (err) {
      updateWindow(wid, { pdfSummary: `Error: ${(err as Error).message}`, pdfLoading: false })
    }
  }

  const askAboutPdf = async () => {
    const q = question.trim()
    if (!q || asking) return
    setQuestion('')
    setAsking(true)
    setAnswer('')

    if (!apiKey) {
      setAnswer('Configure an API key in Settings to ask questions about PDFs.')
      setAsking(false)
      return
    }

    // Open a chat window pre-seeded with PDF context
    const context = win.pdfSummary
      ? `[Regarding the PDF "${name}"]\nSummary: ${win.pdfSummary}\n\nQuestion: ${q}`
      : `[Regarding the PDF "${name}"]\nQuestion: ${q}`

    const newWid = addWindow('chat', {
      pos: { x: win.pos.x + win.size.width + 20, y: win.pos.y },
    })

    // Kick off a chat message in the new window
    const { addMsg, appendMsg, setLoading } = useStore.getState()
    const msgId = `m${Date.now()}`
    addMsg(newWid, { id: msgId + 'u', role: 'user', content: context, ts: Date.now() })
    addMsg(newWid, { id: msgId + 'a', role: 'assistant', content: '', ts: Date.now() })
    setLoading(newWid, true)

    const { sendChat } = await import('../../services/ai')
    try {
      await sendChat(
        [{ role: 'user', content: context }],
        requirements,
        apiKey,
        chunk => appendMsg(newWid, chunk),
      )
    } catch (err) {
      appendMsg(newWid, `\n\n⚠️ Error: ${(err as Error).message}`)
    } finally {
      setLoading(newWid, false)
    }
    setAsking(false)
  }

  return (
    <Window id={wid} title={title}>
      <div className="p-4 h-full overflow-y-auto flex flex-col gap-4">
        {/* File header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-12 bg-rose-100 border border-rose-200 rounded-lg flex items-center justify-center shrink-0">
            <FileText size={18} className="text-rose-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-800 truncate">{win.pdfName}</p>
            <p className="text-xs text-gray-400 mt-0.5">
              {win.pdfLoading ? 'Generating summary…' : win.pdfSummary ? 'Summary ready' : 'No summary yet'}
            </p>
          </div>
        </div>

        {/* Loading */}
        {win.pdfLoading && (
          <div className="flex items-center gap-2 text-sm text-rose-500 bg-rose-50 rounded-xl p-3">
            <div className="w-3 h-3 border-2 border-rose-400 border-t-transparent rounded-full animate-spin shrink-0" />
            Analyzing document…
          </div>
        )}

        {/* Summary */}
        {win.pdfSummary && !win.pdfLoading && (
          <div className="bg-gray-50 border border-gray-100 rounded-xl p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Summary</span>
              {win.pdfBase64 && apiKey && (
                <button
                  className="text-xs text-rose-500 hover:text-rose-700 transition-colors"
                  onClick={regenerate}
                >
                  Regenerate
                </button>
              )}
            </div>
            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{win.pdfSummary}</p>
          </div>
        )}

        {/* No API key state */}
        {!win.pdfSummary && !win.pdfLoading && (
          <p className="text-sm text-gray-400 text-center py-2">
            Add an API key in Settings to generate a summary.
          </p>
        )}

        {/* Ask a question */}
        <div className="mt-auto border-t border-gray-100 pt-3">
          <p className="text-xs font-semibold text-gray-500 mb-2">Ask about this PDF</p>
          <div className="flex gap-2">
            <input
              type="text"
              value={question}
              onChange={e => setQuestion(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && askAboutPdf()}
              placeholder="What is the main finding?"
              className="flex-1 text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-rose-200 transition"
            />
            <button
              onClick={askAboutPdf}
              disabled={!question.trim() || asking}
              className="px-3 py-2 bg-rose-600 text-white rounded-xl hover:bg-rose-700 disabled:opacity-40 transition-colors shrink-0"
            >
              <MessageSquare size={14} />
            </button>
          </div>
          {answer && (
            <p className="text-sm text-gray-700 mt-2 bg-rose-50 rounded-xl p-3 leading-relaxed whitespace-pre-wrap">
              {answer}
            </p>
          )}
        </div>
      </div>
    </Window>
  )
}
