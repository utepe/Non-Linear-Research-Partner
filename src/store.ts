import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AppWindow, WindowType, ChatMsg, CheckItem, Ref } from './types'

const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`

const DEFAULT_SIZES: Record<WindowType, { width: number; height: number }> = {
  chat:       { width: 380, height: 440 },
  notes:      { width: 320, height: 360 },
  pdf:        { width: 320, height: 300 },
  checklist:  { width: 270, height: 310 },
  references: { width: 350, height: 340 },
  auditor:    { width: 420, height: 400 },
}

interface Store {
  // Auth
  isSignedIn: boolean
  userName: string
  projectName: string
  // Project
  requirements: string
  apiKey: string
  // Canvas
  windows: AppWindow[]
  // Global references list
  refs: Ref[]

  signIn: (name: string, project: string) => void
  signOut: () => void
  setRequirements: (r: string) => void
  setApiKey: (k: string) => void

  addWindow: (type: WindowType, overrides?: Partial<AppWindow>) => string
  removeWindow: (wid: string) => void
  updateWindow: (wid: string, u: Partial<AppWindow>) => void
  bringToFront: (wid: string) => void

  addMsg: (wid: string, msg: ChatMsg) => void
  appendMsg: (wid: string, text: string) => void
  setLoading: (wid: string, v: boolean) => void

  addItem: (wid: string) => void
  toggleItem: (wid: string, iid: string) => void
  editItem: (wid: string, iid: string, text: string) => void
  removeItem: (wid: string, iid: string) => void

  addRef: (title: string, url: string) => void
  removeRef: (rid: string) => void
}

export const useStore = create<Store>()(
  persist(
    (set, get) => ({
      isSignedIn: false,
      userName: '',
      projectName: '',
      requirements: '',
      apiKey: '',
      windows: [],
      refs: [],

      signIn: (name, project) => set({ isSignedIn: true, userName: name, projectName: project }),
      signOut: () => set({ isSignedIn: false, windows: [] }),
      setRequirements: (r) => set({ requirements: r }),
      setApiKey: (k) => set({ apiKey: k }),

      addWindow: (type, overrides = {}) => {
        const existing = get().windows
        const topZ = existing.length ? Math.max(...existing.map(w => w.z)) + 1 : 10
        const n = existing.length
        const wid = uid()
        const win: AppWindow = {
          id: wid,
          type,
          pos: overrides.pos ?? { x: 120 + (n % 12) * 32, y: 80 + (n % 8) * 28 },
          size: overrides.size ?? DEFAULT_SIZES[type],
          z: topZ,
          messages: type === 'chat' ? [] : undefined,
          noteText: type === 'notes' ? '' : undefined,
          items: type === 'checklist' ? [] : undefined,
          ...overrides,
        }
        set(s => ({ windows: [...s.windows, win] }))
        return wid
      },

      removeWindow: (wid) =>
        set(s => ({ windows: s.windows.filter(w => w.id !== wid) })),

      updateWindow: (wid, u) =>
        set(s => ({ windows: s.windows.map(w => w.id === wid ? { ...w, ...u } : w) })),

      bringToFront: (wid) => {
        const existing = get().windows
        const topZ = existing.length ? Math.max(...existing.map(w => w.z)) + 1 : 10
        set(s => ({ windows: s.windows.map(w => w.id === wid ? { ...w, z: topZ } : w) }))
      },

      addMsg: (wid, msg) =>
        set(s => ({
          windows: s.windows.map(w =>
            w.id === wid ? { ...w, messages: [...(w.messages ?? []), msg] } : w
          ),
        })),

      appendMsg: (wid, text) =>
        set(s => ({
          windows: s.windows.map(w => {
            if (w.id !== wid || !w.messages?.length) return w
            const msgs = [...w.messages]
            msgs[msgs.length - 1] = {
              ...msgs[msgs.length - 1],
              content: msgs[msgs.length - 1].content + text,
            }
            return { ...w, messages: msgs }
          }),
        })),

      setLoading: (wid, v) =>
        set(s => ({ windows: s.windows.map(w => w.id === wid ? { ...w, loading: v } : w) })),

      addItem: (wid) =>
        set(s => ({
          windows: s.windows.map(w =>
            w.id === wid
              ? { ...w, items: [...(w.items ?? []), { id: uid(), text: '', done: false }] }
              : w
          ),
        })),

      toggleItem: (wid, iid) =>
        set(s => ({
          windows: s.windows.map(w =>
            w.id === wid
              ? { ...w, items: w.items?.map(i => i.id === iid ? { ...i, done: !i.done } : i) }
              : w
          ),
        })),

      editItem: (wid, iid, text) =>
        set(s => ({
          windows: s.windows.map(w =>
            w.id === wid
              ? { ...w, items: w.items?.map(i => i.id === iid ? { ...i, text } : i) }
              : w
          ),
        })),

      removeItem: (wid, iid) =>
        set(s => ({
          windows: s.windows.map(w =>
            w.id === wid ? { ...w, items: w.items?.filter(i => i.id !== iid) } : w
          ),
        })),

      addRef: (title, url) =>
        set(s => ({ refs: [...s.refs, { id: uid(), title, url }] })),

      removeRef: (rid) =>
        set(s => ({ refs: s.refs.filter(r => r.id !== rid) })),
    }),
    {
      name: 'research-partner-v1',
      partialize: (s) => {
        const { windows, ...rest } = s
        return {
          ...rest,
          // Don't persist large PDF base64 blobs
          windows: windows.map(({ pdfBase64: _omit, ...w }) => w),
        }
      },
    }
  )
)
