"use client"
// Navbar: sticky header with responsive navigation and accessible mobile menu
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Menu, X, Zap, Moon, Sun } from 'lucide-react'
import { useTheme } from '../contexts/ThemeContext'

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [user, setUser] = useState(null)
  const { theme, toggleTheme } = useTheme()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })

    // load user from localStorage
    try { const u = localStorage.getItem('user'); if (u) setUser(JSON.parse(u)) } catch (e) { }

    // handle user changes from other pages
    const onUserChange = () => { try { const u = localStorage.getItem('user'); setUser(u ? JSON.parse(u) : null) } catch (e) { } }
    window.addEventListener('storage', onUserChange)
    window.addEventListener('user-changed', onUserChange)

    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('storage', onUserChange)
      window.removeEventListener('user-changed', onUserChange)
    }
  }, [])

  const navLinks = [
    { label: 'Home', href: '/' },
    { label: 'Analyze Resume', href: '/upload-resume' },
    { label: 'Dashboard', href: '/dashboard' }
  ]

  return (
    <header className={`sticky-top z-20 transition-all ${scrolled ? 'shadow-sm bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm' : 'bg-transparent'}`} aria-label="Main navigation">
      <nav className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-4">
            <Link href="/" className="flex items-center gap-2 text-xl font-bold tracking-tight group text-gray-900 dark:text-white">
              <span>SkillSnap<span className="text-primary dark:text-primary-dark">®</span></span>
            </Link>
          </div>

          <div className="hidden md:flex md:space-x-4 md:items-center">
            {navLinks.map(link => (
              <a key={link.label} href={link.href} className="animated-btn animated-btn--sm">{link.label}</a>
            ))}
          </div>

          <div className="flex items-center gap-3">
            {/* Theme toggle button */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            >
              {theme === 'light' ? (
                <Moon className="w-5 h-5 text-gray-700 dark:text-gray-300" />
              ) : (
                <Sun className="w-5 h-5 text-gray-300" />
              )}
            </button>

            <div className="hidden md:flex items-center space-x-3">
              {user ? (
                <Link href="/profile" className="inline-flex items-center gap-2 bg-primary dark:bg-primary-dark text-white text-sm font-medium px-3 py-1.5 rounded-full hover:opacity-95">
                  {user.profilePicture ? (
                    <img src={user.profilePicture} alt={user.fullName} className="w-6 h-6 rounded-full object-cover border border-white/30" />
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" fill="none" className="stroke-current"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /><circle cx="12" cy="7" r="4" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  )}
                  <span className="text-sm">{user.fullName}</span>
                </Link>
              ) : (
                <>
                  <Link href="/login" className="text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-primary dark:hover:text-primary-dark transition-colors">Log in</Link>
                  <Link href="/signup" className="hidden sm:inline-block bg-primary dark:bg-primary-dark text-white text-sm font-medium px-4 py-2 rounded-full hover:opacity-95">Sign up</Link>
                </>
              )}
            </div>

            <label className="hamburger md:hidden p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 dark:text-gray-300" aria-hidden="false">
              <input type="checkbox" aria-label="Toggle menu" checked={open} onChange={() => setOpen(!open)} />
              <svg viewBox="0 0 32 32" className="block">
                <path className="line line-top-bottom" d="M27 10 13 10C10.8 10 9 8.2 9 6 9 3.5 10.8 2 13 2 15.2 2 17 3.8 17 6L17 26C17 28.2 18.8 30 21 30 23.2 30 25 28.2 25 26 25 23.8 23.2 22 21 22L7 22"></path>
                <path className="line" d="M7 16 27 16"></path>
              </svg>
            </label>
          </div>
        </div>

        {/* Mobile menu */}
        <div className={`md:hidden ${open ? 'block' : 'hidden'}`} role="menu" aria-label="Mobile menu">
          <div className="py-4 flex flex-col gap-3">
            {navLinks.map(link => (
              <a key={link.label} href={link.href} onClick={() => setOpen(false)} className="animated-btn animated-btn--sm w-full text-left">{link.label}</a>
            ))}
            <div className="flex items-center px-2 gap-3">
              {user ? (
                <Link href="/profile" className="ml-auto flex items-center gap-2 bg-primary dark:bg-primary-dark text-white px-3 py-1.5 rounded-full text-sm">
                  {user.profilePicture && (
                    <img src={user.profilePicture} alt={user.fullName} className="w-5 h-5 rounded-full object-cover border border-white/30" />
                  )}
                  {user.fullName}
                </Link>
              ) : (
                <>
                  <Link href="/login" className="text-base font-medium dark:text-gray-300">Log in</Link>
                  <Link href="/signup" className="ml-auto bg-primary dark:bg-primary-dark text-white px-3 py-1.5 rounded-full text-sm">Sign up</Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>
    </header>
  )
}