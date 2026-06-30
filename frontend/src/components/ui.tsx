// Shared UI components

export function Drawer({ open, onClose, title, subtitle, children, wide }: {
  open: boolean
  onClose: () => void
  title: string
  subtitle?: string
  children: React.ReactNode
  wide?: boolean
}) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex justify-end" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50" />
      <div
        className={`relative ${wide ? 'w-full max-w-3xl' : 'w-full max-w-lg'} bg-[#0F0B2E] border-l border-[#312E81] h-full overflow-y-auto shadow-2xl`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-[#1A1147] border-b border-[#312E81] px-6 py-4 flex items-center justify-between z-10">
          <div>
            <h2 className="text-lg font-semibold">{title}</h2>
            {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white text-2xl leading-none w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#2D2A6E] transition-colors">
            ×
          </button>
        </div>
        {/* Content */}
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  )
}

export function Badge({ status, children }: { status?: string; children: React.ReactNode }) {
  const colors: Record<string, string> = {
    new: 'bg-blue-500/15 text-blue-400',
    in_progress: 'bg-amber-500/15 text-amber-400',
    qualified: 'bg-purple-500/15 text-purple-400',
    converted: 'bg-emerald-500/15 text-emerald-400',
    rejected: 'bg-red-500/15 text-red-400',
    won: 'bg-emerald-500/15 text-emerald-400',
    lost: 'bg-red-500/15 text-red-400',
    open: 'bg-blue-500/15 text-blue-400',
    active: 'bg-emerald-500/15 text-emerald-400',
    vip: 'bg-purple-500/15 text-purple-400',
  }
  const cls = colors[status || ''] || 'bg-gray-500/15 text-gray-400'
  return <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${cls}`}>{children}</span>
}

export function Modal({ open, onClose, title, children }: {
  open: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
}) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
      <div
        className="bg-[#1E1B4B] border border-[#312E81] rounded-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white text-xl leading-none">×</button>
        </div>
        {children}
      </div>
    </div>
  )
}

export function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs text-gray-400 mb-1.5">{label}</label>
      {children}
    </div>
  )
}

export const inputClass = "w-full bg-[#2D2A6E] border border-[#312E81] rounded-lg px-3 py-2 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-colors"
