import { useState, useRef, useEffect } from 'react'
import { Send, BookmarkPlus, ShieldCheck, Pencil, Check, X, RefreshCw } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { useStore } from '../../store'
import { sendChat } from '../../services/ai'
import Window from '../Window'
import type { ChatMsg } from '../../types'

const uid = () => `m${Date.now()}-${Math.random().toString(36).slice(2, 6)}`

const isError = (content: string) => content.trimStart().startsWith('⚠️')

export default function ChatWindow({ wid }: { wid: string }) {
  const win          = useStore(s => s.windows.find(w => w.id === wid))
  const addMsg       = useStore(s => s.addMsg)
  const appendMsg    = useStore(s => s.appendMsg)
  const setLoading   = useStore(s => s.setLoading)
  const updateWindow = useStore(s => s.updateWindow)
  const requirements = useStore(s => s.requirements)
  const apiKey       = useStore(s => s.apiKey)
  const chatModel    = useStore(s => s.chatModel)
  const addWindow    = useStore(s => s.addWindow)
  const windows      = useStore(s => s.windows)

  const [input, setInput]       = useState('')
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

  // Core send — takes an explicit message list so retry can pass its own snapshot
  const runSend = async (apiMessages: { role: 'user' | 'assistant'; content: string }[]) => {
    addMsg(wid, { id: uid(), role: 'assistant', content: '', ts: Date.now() })
    setLoading(wid, true)
    try {
      if (!apiKey) {
        await new Promise(r => setTimeout(r, 400))
        appendMsg(wid, '⚠️ No API key configured. Click ⚙ Settings in the top-right to add your OpenRouter API key.')
      } else {
        await sendChat(apiMessages, requirements, apiKey, chatModel, chunk => appendMsg(wid, chunk))
      }
    } catch (err) {
      appendMsg(wid, `⚠️ Error: ${(err as Error).message}`)
    } finally {
      setLoading(wid, false)
    }
  }

  const send = async () => {
    const text = input.trim()
    if (!text || win.loading) return
    setInput('')

    const priorMessages = win.messages ?? []
    const userMsg: ChatMsg = { id: uid(), role: 'user', content: text, ts: Date.now() }
    addMsg(wid, userMsg)

    const apiMessages = [...priorMessages, userMsg].map(m => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }))
    await runSend(apiMessages)
  }

  // Retry: remove the last (failed) assistant message, then re-run with history up to the last user msg
  const retry = async (assistantMsgId: string) => {
    if (win.loading) return
    const msgs = win.messages ?? []
    const withoutFailed = msgs.filter(m => m.id !== assistantMsgId)
    updateWindow(wid, { messages: withoutFailed })

    // Build API history: all messages excluding the failed assistant reply
    const apiMessages = withoutFailed.map(m => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }))
    await runSend(apiMessages)
  }

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

  const openAuditor = (content: string, query: string) => {
    addWindow('auditor', {
      auditContent: content,
      auditQuery: query,
      auditPrimaryModel: chatModel,
      pos: { x: win.pos.x + win.size.width + 20, y: win.pos.y },
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
                    : isError(msg.content)
                      ? 'bg-red-50 border border-red-200 text-red-700 rounded-tl-sm'
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
                ) : msg.role === 'assistant' ? (
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      a: ({ href, children }) => (
                        <a href={href} target="_blank" rel="noopener noreferrer" className="underline text-indigo-600 hover:text-indigo-800 break-all">
                          {children}
                        </a>
                      ),
                      p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                      ul: ({ children }) => <ul className="list-disc pl-4 mb-2 space-y-0.5">{children}</ul>,
                      ol: ({ children }) => <ol className="list-decimal pl-4 mb-2 space-y-0.5">{children}</ol>,
                      li: ({ children }) => <li className="leading-relaxed">{children}</li>,
                      strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                      em: ({ children }) => <em className="italic">{children}</em>,
                      code: ({ children }) => <code className="bg-gray-100 text-gray-800 rounded px-1 py-0.5 text-xs font-mono">{children}</code>,
                      pre: ({ children }) => <pre className="bg-gray-100 rounded p-2 text-xs font-mono overflow-x-auto mb-2">{children}</pre>,
                      h1: ({ children }) => <h1 className="font-bold text-base mb-1">{children}</h1>,
                      h2: ({ children }) => <h2 className="font-bold text-sm mb-1">{children}</h2>,
                      h3: ({ children }) => <h3 className="font-semibold text-sm mb-1">{children}</h3>,
                    }}
                  >
                    {msg.content}
                  </ReactMarkdown>
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
                      {/* Retry — always shown, prominent on errors */}
                      <button
                        className={`flex items-center gap-1 text-xs transition-colors ${
                          isError(msg.content)
                            ? 'text-red-500 hover:text-red-700 font-medium'
                            : 'text-gray-400 hover:text-indigo-600'
                        }`}
                        onClick={() => retry(msg.id)}
                        disabled={!!win.loading}
                        title="Retry this response"
                      >
                        <RefreshCw size={11} /> Retry
                      </button>

                      {/* Other actions — only on non-error responses */}
                      {!isError(msg.content) && (
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
