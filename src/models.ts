export interface ModelOption {
  id: string
  name: string
  provider: string
  context: number
  contextLabel: string
  description: string
  isFree: boolean
}

// Fallback list of known-good IDs used only if the API fetch fails.
// These are verified from the OpenRouter docs/API.
export const FALLBACK_MODELS: ModelOption[] = [
  {
    id: 'meta-llama/llama-3.3-70b-instruct:free',
    name: 'Llama 3.3 70B Instruct',
    provider: 'Meta',
    context: 65536,
    contextLabel: '65k',
    description: 'Well-tested, reliable. Great default for research.',
    isFree: true,
  },
  {
    id: 'google/gemma-3-27b-it:free',
    name: 'Gemma 3 27B',
    provider: 'Google',
    context: 131072,
    contextLabel: '131k',
    description: 'Google open model. Good reasoning.',
    isFree: true,
  },
  {
    id: 'meta-llama/llama-3.2-3b-instruct:free',
    name: 'Llama 3.2 3B Instruct',
    provider: 'Meta',
    context: 131072,
    contextLabel: '131k',
    description: 'Lightweight and fast.',
    isFree: true,
  },
]

export const DEFAULT_CHAT_MODEL    = FALLBACK_MODELS[0].id
export const DEFAULT_AUDITOR_MODEL = FALLBACK_MODELS[1].id

// Fetch live free model list from OpenRouter.
// No auth required for the models endpoint.
export async function fetchFreeModels(): Promise<ModelOption[]> {
  const resp = await fetch('https://openrouter.ai/api/v1/models', {
    headers: { 'HTTP-Referer': 'http://localhost:5173', 'X-Title': 'Research Partner' },
  })
  if (!resp.ok) throw new Error(`HTTP ${resp.status}`)

  const data = await resp.json() as {
    data: Array<{
      id: string
      name: string
      context_length: number
      pricing: { prompt: string; completion: string }
      description?: string
    }>
  }

  return data.data
    .filter(m => m.pricing.prompt === '0' && m.pricing.completion === '0')
    .map(m => {
      const provider = m.id.split('/')[0] ?? ''
      const ctx = m.context_length
      const ctxLabel = ctx >= 1_000_000
        ? `${(ctx / 1_000_000).toFixed(0)}M`
        : ctx >= 1000
          ? `${Math.round(ctx / 1000)}k`
          : String(ctx)
      return {
        id: m.id,
        name: m.name.replace(/\s*\(free\)\s*/i, '').trim(),
        provider: capitalise(provider),
        context: ctx,
        contextLabel: ctxLabel,
        description: m.description ?? '',
        isFree: true,
      }
    })
    // Sort by context length descending, then name
    .sort((a, b) => b.context - a.context || a.name.localeCompare(b.name))
}

function capitalise(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

