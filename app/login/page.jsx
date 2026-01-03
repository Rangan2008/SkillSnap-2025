"use client"

import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { FaEye, FaEyeSlash, FaGoogle } from 'react-icons/fa'
import { signInWithPopup } from 'firebase/auth'
import { auth, googleProvider } from '@/lib/firebase'
import { authApi, saveToken } from '@/lib/api'

export default function LoginPage(){
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const router = useRouter()

  const onSubmit = async (e) => {
    e.preventDefault()
    setError('')
    
    if (!email || !password) {
      setError('Please enter email and password')
      return
    }
    
    setLoading(true)
    
    try {
      console.log('Attempting login with:', email)
      const data = await authApi.login(email, password)
      console.log('Login successful:', data)
      
      // Store token and user data
      saveToken(data.data.token)
      localStorage.setItem('user', JSON.stringify(data.data.user))
      window.dispatchEvent(new Event('user-changed'))
      
      console.log('Redirecting to dashboard...')
      // Use window.location for more reliable redirect after login
      window.location.href = '/dashboard'
    } catch (err) {
      console.error('Login error:', err)
      setError(err.message || 'Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    setError('')
    setLoading(true)
    
    try {
      console.log('🔵 Starting Google Sign-In...');
      console.log('Environment:', window.location.hostname);
      
      // Attempt popup sign-in first
      let result;
      try {
        console.log('🔵 Attempting popup sign-in...');
        result = await signInWithPopup(auth, googleProvider);
        console.log('✅ Popup sign-in successful');
      } catch (popupError) {
        // Handle popup-specific errors
        console.error('❌ Popup error:', popupError.code, popupError.message);
        
        if (popupError.code === 'auth/popup-blocked') {
          setError('Popup was blocked by your browser. Please allow popups for this site and try again.');
          setLoading(false);
          return;
        }
        
        if (popupError.code === 'auth/popup-closed-by-user') {
          setError('Sign-in was cancelled. Please try again.');
          setLoading(false);
          return;
        }
        
        if (popupError.code === 'auth/unauthorized-domain') {
          console.error('❌ UNAUTHORIZED DOMAIN ERROR');
          console.error('Current domain:', window.location.hostname);
          console.error('Auth domain:', auth.config.authDomain);
          setError(`This domain (${window.location.hostname}) is not authorized. Contact support.`);
          setLoading(false);
          return;
        }
        
        // Re-throw other errors
        throw popupError;
      }
      
      if (!result || !result.user) {
        throw new Error('No user data returned from Google Sign-In');
      }
      
      console.log('✅ Google Sign-In successful:', result.user.email);
      
      // Get Firebase ID token
      console.log('🔵 Getting Firebase ID token...');
      const firebaseToken = await result.user.getIdToken();
      console.log('✅ Firebase token obtained, length:', firebaseToken.length);
      
      // Exchange Firebase token for backend JWT
      console.log('🔵 Exchanging Firebase token for backend JWT...');
      const data = await authApi.googleLogin(firebaseToken);
      console.log('✅ Backend authentication successful');
      
      // Store backend token and user data
      saveToken(data.data.token);
      localStorage.setItem('user', JSON.stringify(data.data.user));
      window.dispatchEvent(new Event('user-changed'));
      
      console.log('✅ Redirecting to dashboard...');
      window.location.href = '/dashboard';
    } catch (err) {
      console.error('❌ Google login error:', err);
      console.error('Error code:', err.code);
      console.error('Error message:', err.message);
      
      // Provide user-friendly error messages
      let userMessage = 'Google login failed. Please try again.';
      
      if (err.code === 'auth/network-request-failed') {
        userMessage = 'Network error. Please check your connection and try again.';
      } else if (err.code === 'auth/invalid-api-key') {
        userMessage = 'Firebase configuration error. Please contact support.';
      } else if (err.message.includes('Invalid Firebase token')) {
        userMessage = 'Authentication verification failed. Please try again.';
      } else if (err.message) {
        userMessage = err.message;
      }
      
      setError(userMessage);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center py-16 px-4">
      <div className="max-w-md w-full">
        <div className="glass-card p-8 rounded-2xl shadow-md">
          <h1 className="text-2xl font-bold">Welcome back</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-300">Log in to access your dashboard and resume insights.</p>

          {/* Google Sign-In Button */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="mt-6 w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed group"
          >
            <FaGoogle className="text-red-500" size={20} />
            <span className="font-medium group-hover:text-black">Continue with Google</span>
          </button>

          <div className="mt-6 relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white dark:bg-gray-900 text-gray-500 dark:text-gray-400">Or continue with email</span>
            </div>
          </div>

          <form className="mt-6 space-y-4" onSubmit={onSubmit} aria-label="Login form">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Email</label>
              <input type="email" value={email} onChange={e=> setEmail(e.target.value)} className="input mt-1" placeholder="you@example.com" required />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Password</label>
              <div className="relative mt-1">
                <input type={showPassword ? 'text' : 'password'} value={password} onChange={e=> setPassword(e.target.value)} className="input pr-12 w-full" placeholder="••••••••" required />
                <button type="button" aria-label={showPassword ? 'Hide password' : 'Show password'} onClick={()=> setShowPassword(s=>!s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 dark:text-gray-400">
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <button type="submit" className="animated-btn animated-btn--primary w-full sm:w-auto text-center" disabled={loading}>
                {loading ? 'Signing in...' : 'Log in'}
              </button>
              <Link href="/signup" className="text-sm text-white hover:text-black">Create an account</Link>
            </div>
          </form>

          <div className="mt-6 text-sm text-gray-500 dark:text-gray-400">
            <Link href="/" className="hover:underline">Back to home</Link>
          </div>
        </div>
      </div>
    </main>
  )
}
