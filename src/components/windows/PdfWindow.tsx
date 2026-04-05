import { useState } from 'react'
import { FileText, MessageSquare, RefreshCw, Upload } from 'lucide-react'
import { useStore } from '../../store'
import { summarizePdf } from '../../services/ai'
import { extractPdfText } from '../../services/pdfExtract'
import Window from '../Window'

export default function PdfWindow({ wid }: { wid: string }) {
  const win          = useStore(s => s.windows.find(w => w.id === wid))
  const updateWindow = useStore(s => s.updateWindow)
  const addWindow    = useStore(s => s.addWindow)
  const apiKey       = useStore(s => s.apiKey)
  const chatModel    = useStore(s => s.chatModel)
  const requirements = useStore(s => s.requirements)

  const [question, setQuestion] = useState('')
  const [asking, setAsking]     = useState(false)

  if (!win) return null

  const name  = win.pdfName ?? 'Document'
  const title = `PDF — ${name.length > 22 ? name.slice(0, 22) + '…' : name}`

  const doSummarise = async (text: string) => {
    updateWindow(wid, { pdfLoading: true, pdfSummary: '' })
    try {
      let s = ''
      await summarizePdf(text, name, apiKey, chatModel, chunk => {
        s += chunk
        updateWindow(wid, { pdfSummary: s })
      })
      updateWindow(wid, { pdfLoading: false })
    } catch (err) {
      updateWindow(wid, {
        pdfSummary: `⚠️ Error: ${(err as Error).message}`,
        pdfLoading: false,
      })
    }
  }

  const regenerate = () => {
    if (win.pdfText) doSummarise(win.pdfText)
  }

  // Re-upload: re-extract text then re-summarise
  // (pdfText is persisted but re-upload lets the user swap the file)
  const reUpload = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'application/pdf'
    input.onchange = async () => {
      const file = input.files?.[0]
      if (!file) return
      updateWindow(wid, { pdfLoading: true, pdfSummary: '', pdfName: file.name })
      try {
        const buffer = await file.arrayBuffer()
        const text = await extractPdfText(buffer)
        updateWindow(wid, { pdfText: text })
        await doSummarise(text)
      } catch (err) {
        updateWindow(wid, {
          pdfSummary: `⚠️ Could not read PDF: ${(err as Error).message}`,
          pdfLoading: false,
        })
      }
    }
    input.click()
  }

  const isSummaryError  = win.pdfSummary?.startsWith('⚠️')
  const canRegenerate   = !!win.pdfText && !!apiKey && !win.pdfLoading

  const askAboutPdf = async () => {
    const q = question.trim()
    if (!q || asking) return
    setQuestion('')
    setAsking(true)

    if (!apiKey) { setAsking(false); return }

    const context = win.pdfSummary && !isSummaryError
      ? `[Regarding the PDF "${name}"]\nSummary: ${win.pdfSummary}\n\nQuestion: ${q}`
      : `[Regarding the PDF "${name}"]\n${win.pdfText ? `Document text (excerpt):\n${win.pdfText.slice(0, 3000)}\n\n` : ''}Question: ${q}`

    const newWid = addWindow('chat', {
      pos: { x: win.pos.x + win.size.width + 20, y: win.pos.y },
    })

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
        chatModel,
        chunk => appendMsg(newWid, chunk),
      )
    } catch (err) {
      appendMsg(newWid, `⚠️ Error: ${(err as Error).message}`)
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
              {win.pdfLoading
                ? 'Generating summary…'
                : win.pdfSummary && !isSummaryError
                  ? 'Summary ready'
                  : win.pdfText
                    ? 'Text extracted — ready to summarise'
                    : 'No content yet'}
            </p>
          </div>

          {/* Action buttons */}
          {canRegenerate && (
            <button
              onClick={regenerate}
              className="flex items-center gap-1 text-xs text-rose-500 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 px-2 py-1.5 rounded-lg transition-colors shrink-0"
              title="Regenerate summary"
            >
              <RefreshCw size={12} /> Regenerate
            </button>
          )}
          <button
            onClick={reUpload}
            className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 bg-gray-50 hover:bg-gray-100 px-2 py-1.5 rounded-lg transition-colors shrink-0"
            title="Upload a different file"
          >
            <Upload size={12} />
          </button>
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
          <div className={`border rounded-xl p-3 ${
            isSummaryError ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-100'
          }`}>
            <p className={`text-sm leading-relaxed whitespace-pre-wrap ${
              isSummaryError ? 'text-red-700' : 'text-gray-700'
            }`}>
              {win.pdfSummary}
            </p>
            {isSummaryError && canRegenerate && (
              <button
                onClick={regenerate}
                className="mt-2 flex items-center gap-1 text-xs text-red-500 hover:text-red-700 font-medium transition-colors"
              >
                <RefreshCw size={11} /> Try again
              </button>
            )}
          </div>
        )}

        {/* Has text but no summary yet */}
        {!win.pdfSummary && !win.pdfLoading && win.pdfText && apiKey && (
          <button
            onClick={regenerate}
            className="w-full py-2 text-sm border border-rose-200 text-rose-600 rounded-xl hover:bg-rose-50 transition-colors"
          >
            Generate summary
          </button>
        )}

        {/* No API key */}
        {!win.pdfSummary && !win.pdfLoading && !apiKey && (
          <p className="text-sm text-gray-400 text-center py-2">
            Add an OpenRouter API key in ⚙ Settings to generate a summary.
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
              title="Opens a chat window with your question"
            >
              {asking
                ? <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                : <MessageSquare size={14} />
              }
            </button>
          </div>
        </div>
      </div>
    </Window>
  )
}
