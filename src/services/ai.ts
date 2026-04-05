const OPENROUTER_BASE = 'https://openrouter.ai/api/v1'

type Role = 'user' | 'assistant' | 'system'

interface ApiMsg {
  role: Role
  content: string
}

// ── Core fetch ──────────────────────────────────────────────────────────────

async function callOpenRouter(
  messages: ApiMsg[],
  systemPrompt: string,
  apiKey: string,
  model: string,
  onChunk?: (t: string) => void,
): Promise<string> {
  const stream = !!onChunk

  // Use the proper system role — supported by all OpenRouter models
  const allMessages: ApiMsg[] = [
    ...(systemPrompt ? [{ role: 'system' as Role, content: systemPrompt }] : []),
    ...messages,
  ]

  const resp = await fetch(`${OPENROUTER_BASE}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'http://localhost:5173',
      'X-Title': 'Research Partner',
    },
    body: JSON.stringify({
      model,
      messages: allMessages,
      stream,
      max_tokens: 2048,
    }),
  })

  if (!resp.ok) {
    const err = await resp.json().catch(() => ({})) as { error?: { message?: string } }
    throw new Error(err.error?.message ?? `HTTP ${resp.status}`)
  }

  if (!stream) {
    const data = await resp.json() as { choices: Array<{ message: { content: string } }> }
    return data.choices[0]?.message?.content ?? ''
  }

  // SSE streaming — OpenAI-compatible format
  const reader = resp.body!.getReader()
  const dec = new TextDecoder()
  let buf = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buf += dec.decode(value, { stream: true })
    const lines = buf.split('\n')
    buf = lines.pop() ?? ''
    for (const line of lines) {
      if (!line.startsWith('data: ')) continue
      const raw = line.slice(6).trim()
      if (!raw || raw === '[DONE]') continue
      try {
        const evt = JSON.parse(raw) as {
          choices?: Array<{ delta?: { content?: string } }>
        }
        const chunk = evt.choices?.[0]?.delta?.content
        if (chunk) onChunk(chunk)
      } catch { /* malformed chunk, skip */ }
    }
  }
  return ''
}

// ── Public API ───────────────────────────────────────────────────────────────

export interface SimpleMsg { role: 'user' | 'assistant'; content: string }

export async function sendChat(
  messages: SimpleMsg[],
  requirements: string,
  apiKey: string,
  model: string,
  onChunk?: (t: string) => void,
): Promise<void> {
  const system = [
    'You are a helpful AI research assistant. Be accurate and concise. Cite sources when possible.',
    requirements ? `\nProject requirements (always apply these):\n${requirements}` : '',
  ].join('')

  await callOpenRouter(messages, system, apiKey, model, onChunk)
}

export async function summarizePdf(
  extractedText: string,
  filename: string,
  apiKey: string,
  model: string,
  onChunk?: (t: string) => void,
): Promise<string> {
  // Send extracted plain text — works with every model, no multimodal required.
  const truncated = extractedText.length > 80000
    ? extractedText.slice(0, 80000) + '\n\n[Document truncated to fit context window]'
    : extractedText

  const messages: ApiMsg[] = [
    {
      role: 'user',
      content: `Below is the extracted text from the PDF "${filename}".\n\nProvide a concise 2–3 paragraph summary covering: the key research question, methodology, main findings, and relevance to academic research.\n\n---\n${truncated}`,
    },
  ]

  return callOpenRouter(
    messages,
    'You are a research assistant that summarizes academic documents clearly and concisely.',
    apiKey,
    model,
    onChunk,
  )
}

export async function auditResponse(
  query: string,
  aiResponse: string,
  primaryModel: string,
  apiKey: string,
  auditorModel: string,
): Promise<string> {
  const messages: ApiMsg[] = [
    {
      role: 'user',
      content: `**Chat model evaluated:** ${primaryModel}\n**Research Query:** ${query || '(none provided)'}\n\n**Response to evaluate:**\n${aiResponse}\n\nProvide a structured assessment:\n1. **Factual Accuracy** — potential inaccuracies or hallucinations\n2. **Completeness** — important aspects missing\n3. **Confidence Level** — High / Medium / Low with reasoning\n4. **Verification Recommendations** — what the researcher should independently verify`,
    },
  ]

  return callOpenRouter(
    messages,
    'You are a critical independent evaluator of AI-generated academic content. Be direct, specific, and constructive.',
    apiKey,
    auditorModel,
  )
}
