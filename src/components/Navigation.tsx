'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BarChart2, Rss } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function Navigation() {
  const path = usePathname()

  return (
    <header className="page-content sticky top-0 z-50 border-b border-[var(--border)] bg-[var(--bg-base)]/90 backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-7 h-7 rounded-md bg-[var(--accent-blue)] flex items-center justify-center shrink-0">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <ellipse cx="7" cy="7" rx="6" ry="3.5" stroke="white" strokeWidth="1.5"/>
              <line x1="1" y1="7" x2="13" y2="7" stroke="white" strokeWidth="1.5"/>
            </svg>
          </div>
          <span className="font-bold text-[var(--text-primary)] tracking-tight group-hover:text-[var(--accent-blue)] transition-colors">
            RinkPulse
          </span>
        </Link>

        {/* Nav links */}
        <nav className="flex items-center gap-1">
          <NavLink href="/" active={path === '/'} icon={<Rss size={15} />}>
            Stories
          </NavLink>
          <NavLink href="/compare" active={path.startsWith('/compare')} icon={<BarChart2 size={15} />}>
            Compare
          </NavLink>
        </nav>
      </div>
    </header>
  )
}

function NavLink({
  href,
  active,
  icon,
  children,
}: {
  href: string
  active: boolean
  icon: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <Link
      href={href}
      className={cn(
        'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
        active
          ? 'bg-[var(--accent-blue-dim)] text-[var(--accent-blue)]'
          : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/5',
      )}
    >
      {icon}
      {children}
    </Link>
  )
}
