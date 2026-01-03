// Authentication hooks and utilities

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

/**
 * Check if user is authenticated (has valid token)
 */
export function isAuthenticated() {
  if (typeof window === 'undefined') return false
  const token = localStorage.getItem('token')
  return !!token
}

/**
 * Get current user from localStorage
 */
export function getCurrentUser() {
  if (typeof window === 'undefined') return null
  try {
    const userStr = localStorage.getItem('user')
    return userStr ? JSON.parse(userStr) : null
  } catch (e) {
    return null
  }
}

/**
 * Hook for protected routes - redirects to login if not authenticated
 * @param {string} redirectTo - Path to redirect to if not authenticated (default: '/login')
 */
export function useRequireAuth(redirectTo = '/login') {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [user, setUser] = useState(null)

  useEffect(() => {
    const token = localStorage.getItem('token')
    
    if (!token) {
      router.push(redirectTo)
      return
    }

    const currentUser = getCurrentUser()
    setUser(currentUser)
    setIsLoading(false)
  }, [router, redirectTo])

  return { isLoading, user }
}

/**
 * Hook for auth-aware components - doesn't redirect, just provides auth state
 */
export function useAuth() {
  const [user, setUser] = useState(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('token')
    const currentUser = getCurrentUser()
    
    setIsAuthenticated(!!token)
    setUser(currentUser)

    // Listen for auth changes
    const handleAuthChange = () => {
      const newToken = localStorage.getItem('token')
      const newUser = getCurrentUser()
      setIsAuthenticated(!!newToken)
      setUser(newUser)
    }

    window.addEventListener('user-changed', handleAuthChange)
    return () => window.removeEventListener('user-changed', handleAuthChange)
  }, [])

  return { user, isAuthenticated }
}

/**
 * Logout user - clear token and redirect
 */
export function logout() {
  if (typeof window === 'undefined') return
  
  localStorage.removeItem('token')
  localStorage.removeItem('user')
  window.dispatchEvent(new Event('user-changed'))
  window.location.href = '/login'
}
