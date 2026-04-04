import { useState, useRef, useEffect } from 'react'
import { Send, BookmarkPlus, ShieldCheck, Pencil, Check, X } from 'lucide-react'
import { useStore } from '../../store'
import { sendChat } from '../../services/ai'
import Window from '../Window'
import type { ChatMsg } from '../../types'

const uid = () => `m${Date.now()}-${Math.random().toString(36).slice(2, 6)}`

export default function ChatWindow({ wid }: { wid: string }) {
  const win         = useStore(s => s.windows.find(w => w.id === wid))
  const addMsg      = useStore(s => s.addMsg)
  const appendMsg   = useStore(s => s.appendMsg)
  const setLoading  = useStore(s => s.setLoading)
  const updateWindow = useStore(s => s.updateWindow)
  const requirements = useStore(s => s.requirements)
  const apiKey      = useStore(s => s.apiKey)
  const addWindow   = useStore(s => s.addWindow)
  const windows     = useStore(s => s.windows)

  const [input, setInput] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editText, setEditText] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [win?.messages])

  if (!win) return null

  const messageCount = win.messages?.filter(m => m.role === 'user').length ?? 0
  const title = `Chat${messageCount > 0 ? ` — ${messageCount} exchange${messageCount !== 1 ? 's' : ''}` : ''}`

  const send = async () => {
    const text = input.trim()
    if (!text || win.loading) return
    setInput('')

    // Snapshot messages before mutations for API call
    const priorMessages = win.messages ?? []
    const userMsg: ChatMsg = { id: uid(), role: 'user', content: text, ts: Date.now() }

    addMsg(wid, userMsg)
    addMsg(wid, { id: uid(), role: 'assistant', content: '', ts: Date.now() })
    setLoading(wid, true)

    const apiMessages = [...priorMessages, userMsg].map(m => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }))

    try {
      if (!apiKey) {
        await new Promise(r => setTimeout(r, 600))
        appendMsg(wid, '⚠️ No API key configured. Click the ⚙ Settings icon in the top-right to add your Anthropic API key.')
      } else {
        await sendChat(apiMessages, requirements, apiKey, (chunk) => appendMsg(wid, chunk))
      }
    } catch (err) {
      appendMsg(wid, `\n\n⚠️ Error: ${(err as Error).message}`)
    } finally {
      setLoading(wid, false)
    }
  }

  const saveToNotes = (content: string) => {
    const notesWin = windows.find(w => w.type === 'notes')
    if (notesWin) {
      updateWindow(notesWin.id, {
        noteText: (notesWin.noteText ?? '') + '\n\n---\n' + content,
      })
    } else {
      addWindow('notes', { noteText: content })
    }
  }

  const openAuditor = (content: string, query: string) => {
    addWindow('auditor', {
      auditContent: content,
      auditQuery: query,
      pos: { x: (win.pos.x) + win.size.width + 20, y: win.pos.y },
    })
  }

  const commitEdit = (msgId: string) => {
    const updated = (win.messages ?? []).map(m =>
      m.id === msgId ? { ...m, content: editText } : m
    )
    updateWindow(wid, { messages: updated })
    setEditingId(null)
  }

  return (
    <Window id={wid} title={title}>
      <div className="flex flex-col h-full">
        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-3">
          {win.messages?.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center gap-2 py-8">
              <div className="text-3xl">💬</div>
              <p className="text-sm text-gray-400 font-medium">Start a research conversation</p>
              {requirements && (
                <p className="text-xs text-indigo-400 bg-indigo-50 px-3 py-1 rounded-full">
                  Project requirements active
                </p>
              )}
            </div>
          )}

          {win.messages?.map((msg, i) => (
            <div key={msg.id} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
              {/* Bubble */}
              <div
                className={`max-w-[88%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-indigo-600 text-white rounded-tr-sm'
                    : 'bg-gray-50 border border-gray-200 text-gray-800 rounded-tl-sm'
                }`}
              >
                {/* Typing indicator */}
                {msg.role === 'assistant' &&
                  !msg.content &&
                  win.loading &&
                  i === (win.messages?.length ?? 0) - 1 ? (
                  <div className="flex gap-1 py-0.5 px-1">
                    {[0, 150, 300].map(d => (
                      <span
                        key={d}
                        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: `${d}ms` }}
                      />
                    ))}
                  </div>
                ) : editingId === msg.id ? (
                  <textarea
                    className="w-full bg-transparent resize-none focus:outline-none text-sm"
                    value={editText}
                    onChange={e => setEditText(e.target.value)}
                    rows={4}
                    autoFocus
                  />
                ) : (
                  <span className="whitespace-pre-wrap">{msg.content}</span>
                )}
              </div>

              {/* Actions row for assistant messages */}
              {msg.role === 'assistant' && msg.content && (
                <div className="flex items-center gap-2 mt-1 px-1">
                  {editingId === msg.id ? (
                    <>
                      <button
                        className="flex items-center gap-1 text-xs text-green-600 hover:text-green-700 transition-colors"
                        onClick={() => commitEdit(msg.id)}
                      >
                        <Check size={11} /> Save
                      </button>
                      <button
                        className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition-colors"
                        onClick={() => setEditingId(null)}
                      >
                        <X size={11} /> Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        className="flex items-center gap-1 text-xs text-gray-400 hover:text-amber-600 transition-colors"
                        onClick={() => saveToNotes(msg.content)}
                        title="Save to notes"
                      >
                        <BookmarkPlus size={11} /> Notes
                      </button>
                      <button
                        className="flex items-center gap-1 text-xs text-gray-400 hover:text-purple-600 transition-colors"
                        onClick={() => {
                          const query = win.messages?.[i - 1]?.content ?? ''
                          openAuditor(msg.content, query)
                        }}
                        title="Audit this response"
                      >
                        <ShieldCheck size={11} /> Audit
                      </button>
                      <button
                        className="flex items-center gap-1 text-xs text-gray-400 hover:text-indigo-600 transition-colors"
                        onClick={() => { setEditingId(msg.id); setEditText(msg.content) }}
                        title="Edit response"
                      >
                        <Pencil size={11} /> Edit
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Input area */}
        <div className="border-t border-gray-100 p-2.5 flex gap-2 items-end bg-white">
          <textarea
            className="flex-1 text-sm border border-gray-200 rounded-xl px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300 transition min-h-[60px] max-h-[120px]"
            placeholder="Ask a research question…"
            rows={2}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
            }}
          />
          <button
            className="p-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shrink-0"
            onClick={send}
            disabled={!input.trim() || !!win.loading}
            title="Send (Enter)"
          >
            <Send size={15} />
          </button>
        </div>
      </div>
    </Window>
  )
}
