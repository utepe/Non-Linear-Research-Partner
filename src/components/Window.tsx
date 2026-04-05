import type { ReactNode } from 'react'
import { X } from 'lucide-react'
import { useStore } from '../store'
import type { WindowType } from '../types'

const ACCENT: Record<WindowType, { header: string; border: string; text: string; dot: string }> = {
  chat:       { header: '#EEF2FF', border: '#C7D2FE', text: '#3730A3', dot: '#6366F1' },
  notes:      { header: '#FFFBEB', border: '#FDE68A', text: '#92400E', dot: '#F59E0B' },
  pdf:        { header: '#FEF2F2', border: '#FECACA', text: '#991B1B', dot: '#EF4444' },
  checklist:  { header: '#F0FDF4', border: '#BBF7D0', text: '#14532D', dot: '#22C55E' },
  references: { header: '#EFF6FF', border: '#BFDBFE', text: '#1E3A8A', dot: '#3B82F6' },
  auditor:    { header: '#FAF5FF', border: '#E9D5FF', text: '#4C1D95', dot: '#8B5CF6' },
}

interface Props {
  id: string
  title: string
  children: ReactNode
  titleActions?: ReactNode
}

export default function Window({ id, title, children, titleActions }: Props) {
  const win = useStore(s => s.windows.find(w => w.id === id))
  const updateWindow = useStore(s => s.updateWindow)
  const removeWindow = useStore(s => s.removeWindow)
  const bringToFront = useStore(s => s.bringToFront)

  if (!win) return null

  const { pos, size, z, type } = win
  const colors = ACCENT[type]

  const startDrag = (e: React.MouseEvent) => {
    // Don't drag if clicking on interactive elements
    if ((e.target as HTMLElement).closest('button, input, textarea, a, [data-nodrag]')) return
    e.preventDefault()
    bringToFront(id)
    document.body.classList.add('dragging')

    const startMX = e.clientX
    const startMY = e.clientY
    const startX = pos.x
    const startY = pos.y

    const onMove = (ev: MouseEvent) => {
      updateWindow(id, {
        pos: {
          x: Math.max(0, startX + ev.clientX - startMX),
          y: Math.max(0, startY + ev.clientY - startMY),
        },
      })
    }
    const onUp = () => {
      document.body.classList.remove('dragging')
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
    }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  }

  const startResize = (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    bringToFront(id)

    const startMX = e.clientX
    const startMY = e.clientY
    const startW = size.width
    const startH = size.height

    const onMove = (ev: MouseEvent) => {
      updateWindow(id, {
        size: {
          width:  Math.max(260, startW + ev.clientX - startMX),
          height: Math.max(180, startH + ev.clientY - startMY),
        },
      })
    }
    const onUp = () => {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
    }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  }

  return (
    <div
      className="absolute flex flex-col rounded-2xl overflow-hidden"
      style={{
        left: pos.x,
        top:  pos.y,
        width:  size.width,
        height: size.height,
        zIndex: z,
        border: `1.5px solid ${colors.border}`,
        boxShadow: '0 8px 32px rgba(0,0,0,0.10), 0 2px 8px rgba(0,0,0,0.07)',
        background: 'white',
      }}
      onMouseDown={() => bringToFront(id)}
    >
      {/* Title bar */}
      <div
        className="flex items-center px-3 py-2 shrink-0 cursor-grab active:cursor-grabbing gap-2 select-none"
        style={{
          background: colors.header,
          borderBottom: `1px solid ${colors.border}`,
        }}
        onMouseDown={startDrag}
      >
        <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: colors.dot }} />
        <span className="flex-1 text-xs font-semibold truncate" style={{ color: colors.text }}>
          {title}
        </span>
        <div className="flex items-center gap-1" data-nodrag="true">
          {titleActions}
          <button
            className="w-5 h-5 rounded-full flex items-center justify-center text-gray-400 hover:bg-red-100 hover:text-red-500 transition-colors"
            onClick={() => removeWindow(id)}
          >
            <X size={11} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden bg-white">
        {children}
      </div>

      {/* Resize handle */}
      <div
        className="absolute bottom-0 right-0 w-5 h-5 cursor-se-resize"
        style={{
          background: `linear-gradient(135deg, transparent 40%, ${colors.border} 40%)`,
        }}
        onMouseDown={startResize}
      />
    </div>
  )
}
