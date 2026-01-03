"use client"

import { createContext, useContext, useEffect, useState } from 'react'

const ThemeContext = createContext({
    theme: 'light',
    toggleTheme: () => { },
    setTheme: () => { }
})

export function ThemeProvider({ children }) {
    const [theme, setTheme] = useState('light')
    const [mounted, setMounted] = useState(false)

    // Initialize theme from localStorage or system preference
    // This syncs with the theme already set by the head script
    useEffect(() => {
        setMounted(true)
        const savedTheme = localStorage.getItem('theme')
        
        // Get current theme from HTML class (set by head script)
        const htmlTheme = document.documentElement.classList.contains('dark') ? 'dark' : 'light'
        const detectedTheme = savedTheme || htmlTheme || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
        
        setTheme(detectedTheme)
    }, [])

    // Update document class and localStorage when theme changes (only after component mounts)
    useEffect(() => {
        if (!mounted) return

        const root = document.documentElement
        if (theme === 'dark') {
            root.classList.add('dark')
        } else {
            root.classList.remove('dark')
        }

        localStorage.setItem('theme', theme)
    }, [theme, mounted])

    const toggleTheme = () => {
        setTheme(prev => prev === 'light' ? 'dark' : 'light')
    }

    // Prevent flash of wrong theme
    if (!mounted) {
        return <>{children}</>
    }

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
            {children}
        </ThemeContext.Provider>
    )
}

export function useTheme() {
    const context = useContext(ThemeContext)
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider')
    }
    return context
}
