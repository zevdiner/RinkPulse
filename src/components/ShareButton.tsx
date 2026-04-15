'use client'

import { useState } from 'react'
import { Share2, Check } from 'lucide-react'

export default function ShareButton() {
  const [copied, setCopied] = useState(false)

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ url: window.location.href })
      } else {
        await navigator.clipboard.writeText(window.location.href)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      }
    } catch { /* user cancelled */ }
  }

  return (
    <button
      onClick={handleShare}
      aria-label="Share player profile"
      className="shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[var(--border)] text-sm font-medium text-[var(--text-secondary)] hover:border-[var(--border-bright)] hover:text-[var(--text-primary)] transition-all"
    >
      {copied ? <Check size={14} className="text-green-400" /> : <Share2 size={14} />}
      <span className="hidden sm:inline">{copied ? 'Copied!' : 'Share'}</span>
    </button>
  )
}
