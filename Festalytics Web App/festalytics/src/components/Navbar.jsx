'use client'

import { useState, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Menu, X } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'

function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const { openAuthGate } = useAuth()

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }

    window.addEventListener('scroll', handleScroll)
    handleScroll()

    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const closeMenu = () => setIsMenuOpen(false)

  const navLinks = [
    { name: 'Explore Venues', href: '/all-venues' },
    { name: 'Services Map', href: '/service-discovery' },
    { name: 'Find Decor', href: '/find-decor' },
    { name: 'AI Planner', href: '/ai-planner' },
  ]

  const isActive = (href) => pathname === href

  return (
    <nav
      className="sticky top-0 z-50 w-full transition-all duration-300 transform animate-[slideDown_0.5s_ease]"
      style={{
        height: '68px',
        background: 'rgba(255, 255, 255, 0.92)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(214, 51, 108, 0.1)',
        boxShadow: scrolled ? '0 4px 30px rgba(214, 51, 108, 0.15)' : '0 2px 20px rgba(214, 51, 108, 0.08)',
      }}
    >
      <div className="max-w-[1200px] mx-auto h-full flex justify-between items-center px-6 md:px-8">
        <Link
          href="/"
          className="flex items-center gap-2 no-underline transition-transform duration-300 hover:scale-[1.02]"
          onClick={closeMenu}
        >
          <span className="font-bold text-[20px] bg-gradient-to-br from-[#D6336C] to-[#ff6eb4] text-transparent bg-clip-text">
            Festalytics
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-1">
          <ul className="flex list-none m-0 p-0 gap-1 items-center">
            {navLinks.map((link) => (
              <li key={link.name}>
                <Link
                  href={link.href}
                  className={`block px-3 py-2 text-[14px] rounded-lg transition-colors no-underline ${
                    isActive(link.href)
                      ? 'text-[#D6336C] font-semibold bg-pink-50'
                      : 'text-[#374151] font-medium hover:text-[#D6336C]'
                  }`}
                >
                  {link.name}
                </Link>
              </li>
            ))}
          </ul>

          <button
            type="button"
            onClick={() => openAuthGate('login')}
            className="ml-3 px-4 py-2 text-[14px] font-semibold text-[#D6336C] border border-[#D6336C]/30 rounded-full bg-white cursor-pointer hover:bg-pink-50 transition-colors"
          >
            Log in
          </button>
          <Link
            href="/signup"
            className="ml-2 px-4 py-2 text-[14px] font-semibold text-gray-700 border border-gray-200 rounded-full bg-white no-underline hover:border-[#D6336C]/40 hover:text-[#D6336C] transition-colors"
          >
            Sign up
          </Link>
          <Link
            href="/login?type=vendor"
            className="ml-2 px-4 py-2 text-[14px] font-semibold text-gray-600 hover:text-[#D6336C] no-underline transition-colors hidden lg:inline-flex items-center gap-1"
          >
            For Venues
          </Link>
          <button
            type="button"
            onClick={() => router.push('/all-venues')}
            className="ml-2 bg-gradient-to-r from-[#D6336C] to-[#ff6eb4] text-white px-5 py-2 rounded-full font-semibold text-[14px] shadow-[0_4px_15px_rgba(214,51,108,0.3)] cursor-pointer border-0 hover:scale-105 transition-transform"
          >
            Explore Venues
          </button>
        </div>

        <button
          type="button"
          className="md:hidden flex items-center justify-center bg-transparent border-none p-2 cursor-pointer text-[#D6336C]"
          onClick={() => setIsMenuOpen((v) => !v)}
          aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
        >
          {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      <div
        className={`md:hidden absolute top-[68px] left-0 w-full bg-white overflow-hidden transition-all duration-300 ease-in-out shadow-lg ${
          isMenuOpen ? 'max-h-[420px] opacity-100 border-b border-gray-100' : 'max-h-0 opacity-0'
        }`}
      >
        <ul className="flex flex-col list-none m-0 p-4 gap-0">
          {navLinks.map((link) => (
            <li key={link.name} className="border-b border-[#f0f0f0] last:border-none">
              <Link
                href={link.href}
                className={`block px-4 py-3 text-[15px] no-underline ${
                  isActive(link.href) ? 'text-[#D6336C] font-semibold' : 'text-[#374151] font-medium'
                }`}
                onClick={closeMenu}
              >
                {link.name}
              </Link>
            </li>
          ))}
          <li className="mt-4 flex flex-col gap-2 px-4 pb-2">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  closeMenu()
                  openAuthGate('login')
                }}
                className="flex-1 py-3 text-[#D6336C] font-semibold border border-[#D6336C]/30 rounded-full bg-white cursor-pointer"
              >
                Log in
              </button>
              <Link
                href="/signup"
                onClick={closeMenu}
                className="flex-1 py-3 text-center text-gray-700 font-semibold border border-gray-200 rounded-full bg-white no-underline"
              >
                Sign up
              </Link>
            </div>
            <Link
              href="/login?type=vendor"
              onClick={closeMenu}
              className="block py-3 text-center text-sm font-semibold text-gray-600 hover:text-[#D6336C] no-underline"
            >
              For Venues → Vendor Portal
            </Link>
            <button
              type="button"
              onClick={() => {
                closeMenu()
                router.push('/all-venues')
              }}
              className="w-full py-3 bg-gradient-to-r from-[#D6336C] to-[#ff6eb4] text-white rounded-full font-semibold border-0 cursor-pointer"
            >
              Explore Venues
            </button>
          </li>
        </ul>
      </div>
    </nav>
  )
}

export default Navbar
