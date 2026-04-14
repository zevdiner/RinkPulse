'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface GlossaryEntry {
  label: string
  description: string
}

interface Props {
  entries: GlossaryEntry[]
}

export default function StatGlossary({ entries }: Props) {
  const [open, setOpen] = useState(false)

  return (
    <div className="border-t border-[var(--border)]">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-3 text-xs text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
      >
        <span className="font-medium tracking-wide">Stat glossary</span>
        <ChevronDown
          size={14}
          className={cn('transition-transform duration-200', open && 'rotate-180')}
        />
      </button>

      {open && (
        <div className="px-5 pb-4 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2">
          {entries.map(e => (
            <div key={e.label} className="flex gap-2 text-xs leading-snug">
              <span className="font-bold text-[var(--text-secondary)] shrink-0 w-14 text-right tabular-nums">
                {e.label}
              </span>
              <span className="text-[var(--text-muted)]">{e.description}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
