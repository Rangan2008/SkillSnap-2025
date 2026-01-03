"use client"

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { authApi } from '@/lib/api'

const ROLE_OPTIONS = [
  'Frontend Developer', 'Backend Developer', 'Full Stack Developer', 'Data Scientist', 'DevOps Engineer', 'Product Manager', 'UI/UX Designer'
]

export default function ProfilePage(){
  const [user, setUser] = useState(null)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [avatar, setAvatar] = useState('') // URL from backend
  const [avatarPreview, setAvatarPreview] = useState('') // Local preview
  const [selectedFile, setSelectedFile] = useState(null) // File to upload
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [prefs, setPrefs] = useState([])
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef(null)
  const router = useRouter()

  // Fetch user profile from backend
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const token = localStorage.getItem('token')
        if (!token) {
          router.push('/login')
          return
        }

        const data = await authApi.getProfile()
        const userData = data.data.user
        setUser(userData)
        setName(userData.fullName || '')
        setEmail(userData.email || '')
        setAvatar(userData.profilePicture || '')
        setPrefs(userData.jobPreferences || [])
      } catch (err) {
        console.error('Failed to fetch profile:', err)
        setError('Failed to load profile')
        // If unauthorized, redirect to login
        if (err.message.includes('Unauthorized')) {
          localStorage.removeItem('token')
          localStorage.removeItem('user')
          router.push('/login')
        }
      } finally {
        setLoading(false)
      }
    }

    fetchUserProfile()
  }, [router])

  const logout = async () => {
    try {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.dispatchEvent(new Event('user-changed'))
      router.push('/')
    } catch (err) {
      setError('Failed to logout. Please try again.')
    }
  }

  const onAvatarChange = (e) => {
    const f = e.target.files && e.target.files[0]
    if (!f) return
    
    // Validate file type
    if (!f.type.startsWith('image/')) {
      setError('Please select an image file')
      return
    }
    
    // Validate file size (5MB)
    if (f.size > 5 * 1024 * 1024) {
      setError('Image size should be less than 5MB')
      return
    }
    
    setSelectedFile(f)
    const reader = new FileReader()
    reader.onload = () => setAvatarPreview(reader.result)
    reader.readAsDataURL(f)
  }

  const uploadProfilePicture = async () => {
    if (!selectedFile) {
      setError('Please select an image first')
      return
    }

    setUploading(true)
    setError('')
    setMessage('')

    try {
      const data = await authApi.uploadProfilePicture(selectedFile)
      setAvatar(data.data.profilePicture)
      setAvatarPreview('')
      setSelectedFile(null)
      setMessage('Profile picture updated successfully!')
      
      // Update localStorage
      const user = JSON.parse(localStorage.getItem('user') || '{}')
      user.profilePicture = data.data.profilePicture
      localStorage.setItem('user', JSON.stringify(user))
      window.dispatchEvent(new Event('user-changed'))
      
      if (fileRef.current) fileRef.current.value = ''
      setTimeout(() => setMessage(''), 2500)
    } catch (err) {
      console.error('Upload error:', err)
      setError(err.message || 'Failed to upload profile picture')
    } finally {
      setUploading(false)
    }
  }

  const removeAvatar = () => {
    setAvatarPreview('')
    setSelectedFile(null)
    if (fileRef.current) fileRef.current.value = ''
  }

  const togglePref = (role) => {
    setPrefs(prev => prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role])
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setMessage('')
    
    if (!name || !email) {
      setError('Please provide name and email')
      return
    }
    
    if (password || confirm) {
      if (password !== confirm) {
        setError('Passwords do not match')
        return
      }
    }

    try {
      const updateData = {
        fullName: name,
        jobPreferences: prefs
      }

      const data = await authApi.updateProfile(updateData)
      const updatedUser = data.data.user
      setUser(updatedUser)
      setMessage('Profile updated successfully!')
      window.dispatchEvent(new Event('user-changed'))
      
      // Clear message after 2.5 seconds
      setTimeout(() => setMessage(''), 2500)
    } catch (err) {
      console.error('Update error:', err)
      setError(err.message || 'Failed to save profile')
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center py-16 px-4">
        <div className="text-white text-xl">Loading...</div>
      </main>
    )
  }

  if (!user) return (
    <main className="min-h-screen flex items-center justify-center py-16 px-4">
      <div className="max-w-md w-full">
        <div className="glass-card p-8 rounded-2xl">
          <h1 className="text-xl font-bold">No profile found</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-300">You are not signed in. <Link href="/login" className="text-primary">Log in</Link> or <Link href="/signup" className="text-primary">Sign up</Link>.</p>
        </div>
      </div>
    </main>
  )

  return (
    <main className="min-h-screen flex items-center justify-center py-16 px-4">
      <div className="max-w-2xl w-full">
        <div className="glass-card p-8 rounded-2xl">
          <h1 className="text-2xl font-bold">Profile</h1>
          <p className="mt-1 text-gray-600 dark:text-gray-300">Manage your account and preferences.</p>

          <form onSubmit={onSubmit} className="mt-6 grid grid-cols-1 gap-4">
            <div className="flex items-center gap-4">
              <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center border-2 border-gray-200">
                {(avatarPreview || avatar) ? (
                  <img src={avatarPreview || avatar} alt="avatar" className="w-full h-full object-cover" />
                ) : (
                  <div className="text-gray-500 dark:text-gray-400 text-sm text-center">No photo</div>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <input ref={fileRef} type="file" accept="image/*" onChange={onAvatarChange} className="text-sm hidden" />
                <div className="flex gap-2 flex-wrap">
                  <button type="button" onClick={()=> fileRef.current && fileRef.current.click()} className="animated-btn animated-btn--sm">
                    {avatar ? 'Change' : 'Upload'}
                  </button>
                  {selectedFile && (
                    <button type="button" onClick={uploadProfilePicture} disabled={uploading} className="animated-btn animated-btn--primary animated-btn--sm">
                      {uploading ? 'Uploading...' : 'Save Photo'}
                    </button>
                  )}
                  {avatarPreview && (
                    <button type="button" onClick={removeAvatar} className="animated-btn animated-btn--sm">Cancel</button>
                  )}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Max 5MB • JPG, PNG, GIF</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Full name</label>
              <input value={name} onChange={e=> setName(e.target.value)} className="input mt-1" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Email</label>
              <input type="email" value={email} onChange={e=> setEmail(e.target.value)} className="input mt-1" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">New password <span className="text-xs text-gray-400 dark:text-gray-500">(leave blank to keep current)</span></label>
              <input type="password" value={password} onChange={e=> setPassword(e.target.value)} className="input mt-1" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Confirm password</label>
              <input type="password" value={confirm} onChange={e=> setConfirm(e.target.value)} className="input mt-1" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Job role preferences</label>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {ROLE_OPTIONS.map(role=> (
                  <label key={role} className="inline-flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={prefs.includes(role)} onChange={()=> togglePref(role)} className="accent-primary" />
                    <span className="text-sm">{role}</span>
                  </label>
                ))}
              </div>
            </div>

            {error && <div className="text-sm text-red-600">{error}</div>}
            {message && <div className="text-sm text-green-600">{message}</div>}

            <div className="flex items-center gap-3 mt-4">
              <button type="submit" className="animated-btn animated-btn--primary">Save changes</button>
              <button type="button" onClick={logout} className="animated-btn">Log out</button>
            </div>

          </form>
        </div>
      </div>
    </main>
  )
}