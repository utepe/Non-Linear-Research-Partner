export type WindowType = 'chat' | 'notes' | 'pdf' | 'checklist' | 'references' | 'auditor'

export interface Position { x: number; y: number }
export interface Size { width: number; height: number }

export interface ChatMsg {
  id: string
  role: 'user' | 'assistant'
  content: string
  ts: number
}

export interface CheckItem {
  id: string
  text: string
  done: boolean
}

export interface Ref {
  id: string
  title: string
  url: string
}

export interface AppWindow {
  id: string
  type: WindowType
  pos: Position
  size: Size
  z: number
  // chat
  messages?: ChatMsg[]
  loading?: boolean
  // notes
  noteText?: string
  // pdf
  pdfName?: string
  pdfSummary?: string
  pdfLoading?: boolean
  pdfBase64?: string
  // checklist (items stored at top-level)
  items?: CheckItem[]
  // auditor
  auditContent?: string
  auditQuery?: string
  auditResult?: string
  auditLoading?: boolean
}
