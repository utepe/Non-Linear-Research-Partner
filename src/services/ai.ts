type Role = 'user' | 'assistant'

interface SimpleMsg { role: Role; content: string }

interface ContentBlock {
  type: 'text' | 'document'
  text?: string
  source?: { type: 'base64'; media_type: 'application/pdf'; data: string }
}

interface ApiMsg { role: Role; content: string | ContentBlock[] }

async function callAnthropic(
  messages: ApiMsg[],
  system: string,
  apiKey: string,
  onChunk?: (t: string) => void,
): Promise<string> {
  const stream = !!onChunk

  const resp = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-opus-4-6',
      max_tokens: 2048,
      stream,
      system,
      messages,
    }),
  })

  if (!resp.ok) {
    const err = await resp.json().catch(() => ({})) as { error?: { message?: string } }
    throw new Error(err.error?.message ?? `HTTP ${resp.status}`)
  }

  if (!stream) {
    const data = await resp.json() as { content: Array<{ text: string }> }
    return data.content[0].text
  }

  // SSE streaming
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
          type: string
          delta?: { type: string; text: string }
        }
        if (evt.type === 'content_block_delta' && evt.delta?.type === 'text_delta') {
          onChunk?.(evt.delta.text)
        }
      } catch { /* malformed chunk, skip */ }
    }
  }
  return '' // content was streamed via onChunk
}

export async function sendChat(
  messages: SimpleMsg[],
  requirements: string,
  apiKey: string,
  onChunk?: (t: string) => void,
): Promise<void> {
  const system = [
    'You are a helpful AI research assistant. Be accurate, concise, and cite sources when possible.',
    requirements
      ? `\nProject context and requirements (apply to all responses):\n${requirements}`
      : '',
  ].join('')

  await callAnthropic(messages, system, apiKey, onChunk)
}

export async function summarizePdf(
  base64: string,
  apiKey: string,
  onChunk?: (t: string) => void,
): Promise<string> {
  const messages: ApiMsg[] = [
    {
      role: 'user',
      content: [
        {
          type: 'document',
          source: { type: 'base64', media_type: 'application/pdf', data: base64 },
        },
        {
          type: 'text',
          text: 'Provide a concise 2–3 paragraph summary highlighting: key research question, methodology, main findings, and relevance to academic research.',
        },
      ],
    },
  ]
  return callAnthropic(
    messages,
    'You are a research assistant that summarizes academic documents clearly and concisely.',
    apiKey,
    onChunk,
  )
}

export async function auditResponse(
  query: string,
  aiResponse: string,
  apiKey: string,
): Promise<string> {
  const messages: ApiMsg[] = [
    {
      role: 'user',
      content: `Critically evaluate this AI response for academic research purposes.\n\n**Research Query:** ${query}\n\n**AI Response:**\n${aiResponse}\n\nProvide a structured assessment covering:\n1. **Factual Accuracy** — any potential inaccuracies or hallucinations\n2. **Completeness** — important aspects that are missing\n3. **Confidence Level** — High / Medium / Low, with reasoning\n4. **Verification Recommendations** — what the researcher should independently verify`,
    },
  ]
  return callAnthropic(
    messages,
    'You are a critical evaluator of AI-generated academic content. Be direct, specific, and constructive.',
    apiKey,
  )
}
