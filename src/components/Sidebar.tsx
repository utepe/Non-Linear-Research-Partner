import { MessageSquare, FileText, Upload, CheckSquare, BookMarked } from 'lucide-react'
import { useStore } from '../store'
import { summarizePdf } from '../services/ai'
import { extractPdfText } from '../services/pdfExtract'

interface SidebarBtn {
  icon: React.ReactNode
  label: string
  action: () => void
  color: string
}

export default function Sidebar() {
  const addWindow = useStore(s => s.addWindow)
  const windows   = useStore(s => s.windows)

  const handlePdfUpload = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'application/pdf'
    input.onchange = async () => {
      const file = input.files?.[0]
      if (!file) return

      const wid = addWindow('pdf', { pdfName: file.name, pdfLoading: true })
      const { apiKey, chatModel, updateWindow } = useStore.getState()

      // Extract text from the PDF client-side first
      let pdfText = ''
      try {
        const buffer = await file.arrayBuffer()
        pdfText = await extractPdfText(buffer)
        updateWindow(wid, { pdfText })
      } catch (err) {
        updateWindow(wid, {
          pdfLoading: false,
          pdfSummary: `⚠️ Could not read PDF: ${(err as Error).message}`,
        })
        return
      }

      if (!pdfText.trim()) {
        updateWindow(wid, {
          pdfLoading: false,
          pdfSummary: '⚠️ No readable text found in this PDF. It may be a scanned image without OCR.',
        })
        return
      }

      if (!apiKey) {
        updateWindow(wid, {
          pdfLoading: false,
          pdfSummary: 'Add an OpenRouter API key in ⚙ Settings to auto-summarize PDFs.',
        })
        return
      }

      try {
        let summary = ''
        await summarizePdf(pdfText, file.name, apiKey, chatModel, chunk => {
          summary += chunk
          useStore.getState().updateWindow(wid, { pdfSummary: summary })
        })
        useStore.getState().updateWindow(wid, { pdfLoading: false })
      } catch (err) {
        useStore.getState().updateWindow(wid, {
          pdfSummary: `⚠️ Error generating summary: ${(err as Error).message}`,
          pdfLoading: false,
        })
      }
    }
    input.click()
  }

  const buttons: SidebarBtn[] = [
    {
      icon: <MessageSquare size={20} />,
      label: 'New Chat',
      color: 'text-indigo-600 hover:bg-indigo-50',
      action: () => addWindow('chat'),
    },
    {
      icon: <FileText size={20} />,
      label: 'New Notes',
      color: 'text-amber-600 hover:bg-amber-50',
      action: () => addWindow('notes'),
    },
    {
      icon: <Upload size={20} />,
      label: 'Upload PDF',
      color: 'text-rose-600 hover:bg-rose-50',
      action: handlePdfUpload,
    },
    {
      icon: <CheckSquare size={20} />,
      label: 'Checklist',
      color: 'text-green-600 hover:bg-green-50',
      action: () => addWindow('checklist'),
    },
    {
      icon: <BookMarked size={20} />,
      label: 'References',
      color: 'text-blue-600 hover:bg-blue-50',
      action: () => {
        if (!windows.some(w => w.type === 'references')) addWindow('references')
      },
    },
  ]

  return (
    <div className="w-14 h-full bg-white border-r border-gray-200 flex flex-col items-center py-3 gap-1 shrink-0 shadow-sm z-[9999]">
      {/* Logo */}
      <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-xl flex items-center justify-center mb-3 shadow-sm">
        <span className="text-white text-xs font-bold">NR</span>
      </div>

      <div className="w-full h-px bg-gray-100 mb-1" />

      {buttons.map((btn) => (
        <div key={btn.label} className="relative group w-full flex justify-center">
          <button
            onClick={btn.action}
            title={btn.label}
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${btn.color}`}
          >
            {btn.icon}
          </button>
          {/* Tooltip */}
          <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 bg-gray-800 text-white text-xs rounded-lg px-2 py-1 whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-[999999]">
            {btn.label}
          </div>
        </div>
      ))}
    </div>
  )
}
