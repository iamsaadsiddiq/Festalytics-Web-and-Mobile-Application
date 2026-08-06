'use client'

import { useState, useRef, useEffect } from 'react'

export default function HeroSearchSelect({
  value,
  onChange,
  placeholder,
  options,
  className = '',
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (!open) return
    const handleEscape = (e) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [open])

  const selected = options.find((o) => o.value === value)
  const displayLabel = selected?.label ?? placeholder

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
        className="w-full flex items-center justify-between gap-3 bg-transparent border-none py-0.5 focus:ring-0 text-left cursor-pointer outline-none"
      >
        <span
          className={`font-semibold text-sm truncate ${
            value ? 'text-on-surface' : 'text-on-surface-variant'
          }`}
        >
          {displayLabel}
        </span>
        <span
          className={`material-symbols-outlined text-[18px] text-outline shrink-0 transition-transform duration-200 ${
            open ? 'rotate-180' : ''
          }`}
        >
          expand_more
        </span>
      </button>

      {open && (
        <ul
          role="listbox"
          className="absolute left-0 right-0 top-[calc(100%+8px)] z-[100] max-h-52 overflow-y-auto rounded-2xl bg-white border border-outline-variant/20 shadow-2xl py-1.5"
        >
          {options.map((opt) => {
            const isSelected = value === opt.value
            return (
              <li key={opt.value || '__empty'} role="option" aria-selected={isSelected}>
                <button
                  type="button"
                  onClick={() => {
                    onChange(opt.value)
                    setOpen(false)
                  }}
                  className={`w-full text-left px-4 py-2.5 text-sm transition-colors cursor-pointer border-0 ${
                    isSelected
                      ? 'bg-primary/10 text-primary font-semibold'
                      : 'bg-transparent text-on-surface hover:bg-surface-container-high'
                  }`}
                >
                  {opt.label}
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
