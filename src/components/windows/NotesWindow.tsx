import { useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Bold, Italic, List, ListOrdered, Minus, Eye, Pencil } from 'lucide-react'
import { useStore } from '../../store'
import Window from '../Window'

type FormatType = 'bold' | 'italic' | 'bullet' | 'number' | 'hr'

export default function NotesWindow({ wid }: { wid: string }) {
  const win          = useStore(s => s.windows.find(w => w.id === wid))
  const updateWindow = useStore(s => s.updateWindow)
  const textareaRef  = useRef<HTMLTextAreaElement>(null)
  const [preview, setPreview] = useState(false)

  if (!win) return null

  const text      = win.noteText ?? ''
  const wordCount = text.split(/\s+/).filter(Boolean).length

  const applyFormat = (type: FormatType) => {
    const el = textareaRef.current
    if (!el) return
    const { selectionStart: ss, selectionEnd: se, value } = el
    const selected = value.slice(ss, se)

    let replacement: string
    let selectStart: number
    let selectEnd: number

    switch (type) {
      case 'bold': {
        const inner = selected || 'bold text'
        replacement = `**${inner}**`
        selectStart = ss + 2
        selectEnd   = ss + 2 + inner.length
        break
      }
      case 'italic': {
        const inner = selected || 'italic text'
        replacement = `*${inner}*`
        selectStart = ss + 1
        selectEnd   = ss + 1 + inner.length
        break
      }
      case 'bullet': {
        replacement = selected
          ? selected.split('\n').map(l => `- ${l}`).join('\n')
          : '- '
        selectStart = ss + replacement.length
        selectEnd   = selectStart
        break
      }
      case 'number': {
        replacement = selected
          ? selected.split('\n').map((l, i) => `${i + 1}. ${l}`).join('\n')
          : '1. '
        selectStart = ss + replacement.length
        selectEnd   = selectStart
        break
      }
      case 'hr': {
        const prefix = ss > 0 && value[ss - 1] !== '\n' ? '\n' : ''
        replacement  = `${prefix}\n---\n\n`
        selectStart  = ss + replacement.length
        selectEnd    = selectStart
        break
      }
    }

    const newValue = value.slice(0, ss) + replacement + value.slice(se)
    updateWindow(wid, { noteText: newValue })

    setTimeout(() => {
      el.focus()
      el.setSelectionRange(selectStart, selectEnd)
    }, 0)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'b') { e.preventDefault(); applyFormat('bold') }
    if ((e.metaKey || e.ctrlKey) && e.key === 'i') { e.preventDefault(); applyFormat('italic') }
  }

  const toolbarBtns: { icon: React.ReactNode; type: FormatType; title: string }[] = [
    { icon: <Bold size={13} />,         type: 'bold',   title: 'Bold (⌘B)' },
    { icon: <Italic size={13} />,       type: 'italic', title: 'Italic (⌘I)' },
    { icon: <List size={13} />,         type: 'bullet', title: 'Bullet list' },
    { icon: <ListOrdered size={13} />,  type: 'number', title: 'Numbered list' },
    { icon: <Minus size={13} />,        type: 'hr',     title: 'Divider' },
  ]

  return (
    <Window id={wid} title={`Notes${wordCount > 0 ? ` — ${wordCount} words` : ''}`}>
      <div className="flex flex-col h-full">

        {/* Toolbar */}
        <div className="flex items-center gap-0.5 px-2 py-1 border-b border-amber-100 bg-amber-50 shrink-0">
          {toolbarBtns.map(btn => (
            <button
              key={btn.type}
              title={btn.title}
              onMouseDown={e => { e.preventDefault(); applyFormat(btn.type) }}
              className="w-7 h-7 flex items-center justify-center rounded hover:bg-amber-200 text-amber-700 transition-colors"
            >
              {btn.icon}
            </button>
          ))}

          <div className="w-px h-4 bg-amber-200 mx-1" />

          <button
            title={preview ? 'Edit' : 'Preview'}
            onClick={() => setPreview(p => !p)}
            className={`w-7 h-7 flex items-center justify-center rounded transition-colors text-amber-700 ${
              preview ? 'bg-amber-200' : 'hover:bg-amber-200'
            }`}
          >
            {preview ? <Pencil size={13} /> : <Eye size={13} />}
          </button>
        </div>

        {/* Content area */}
        {preview ? (
          <div className="flex-1 overflow-y-auto p-3 text-sm text-gray-700 leading-relaxed">
            {text ? (
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  a: ({ href, children }) => (
                    <a href={href} target="_blank" rel="noopener noreferrer" className="underline text-amber-600 hover:text-amber-800 break-all">
                      {children}
                    </a>
                  ),
                  p:      ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                  ul:     ({ children }) => <ul className="list-disc pl-4 mb-2 space-y-0.5">{children}</ul>,
                  ol:     ({ children }) => <ol className="list-decimal pl-4 mb-2 space-y-0.5">{children}</ol>,
                  li:     ({ children }) => <li className="leading-relaxed">{children}</li>,
                  strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                  em:     ({ children }) => <em className="italic">{children}</em>,
                  hr:     () => <hr className="border-amber-200 my-3" />,
                  code:   ({ children }) => <code className="bg-amber-100 text-amber-800 rounded px-1 py-0.5 text-xs font-mono">{children}</code>,
                  h1:     ({ children }) => <h1 className="font-bold text-base mb-1 mt-2">{children}</h1>,
                  h2:     ({ children }) => <h2 className="font-bold text-sm mb-1 mt-2">{children}</h2>,
                  h3:     ({ children }) => <h3 className="font-semibold text-sm mb-1 mt-1">{children}</h3>,
                }}
              >
                {text}
              </ReactMarkdown>
            ) : (
              <p className="text-gray-300 italic">Nothing to preview yet.</p>
            )}
          </div>
        ) : (
          <textarea
            ref={textareaRef}
            className="flex-1 w-full p-3 text-sm resize-none focus:outline-none leading-relaxed text-gray-700 placeholder-gray-300 font-mono"
            placeholder={'Type your research notes here…\n\nTip: Use ⌘B / ⌘I to format, or the toolbar above.\nUse "Save to notes" on any AI response to collect insights.'}
            value={text}
            onChange={e => updateWindow(wid, { noteText: e.target.value })}
            onKeyDown={handleKeyDown}
          />
        )}

        {/* Footer */}
        <div className="border-t border-amber-100 px-3 py-1.5 bg-amber-50 flex justify-between items-center shrink-0">
          <span className="text-xs text-amber-500">{wordCount} words</span>
          <button
            className="text-xs text-amber-500 hover:text-amber-700 transition-colors"
            onClick={() => navigator.clipboard.writeText(text).catch(() => {})}
          >
            Copy all
          </button>
        </div>
      </div>
    </Window>
  )
}
