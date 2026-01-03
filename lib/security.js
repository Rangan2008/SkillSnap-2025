/**
 * Security Utilities
 * Safe alternatives to potentially dangerous JavaScript patterns
 * CSP-compliant code execution helpers
 */

/**
 * Safe Timer Functions
 * Always use function references, never strings
 */

/**
 * Debounce function - delays execution until after a wait period
 * @param {Function} func - Function to debounce
 * @param {number} wait - Milliseconds to wait
 * @returns {Function} Debounced function
 * 
 * @example
 * const debouncedSearch = debounce((query) => {
 *   // Search logic
 * }, 300);
 */
export function debounce(func, wait) {
  let timeout
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

/**
 * Throttle function - limits execution rate
 * @param {Function} func - Function to throttle
 * @param {number} limit - Minimum time between executions (ms)
 * @returns {Function} Throttled function
 * 
 * @example
 * const throttledScroll = throttle(() => {
 *   // Scroll handler
 * }, 100);
 */
export function throttle(func, limit) {
  let inThrottle
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  }
}

/**
 * Safe Delay - Promise-based delay (alternative to setTimeout)
 * @param {number} ms - Milliseconds to delay
 * @returns {Promise} Resolves after delay
 * 
 * @example
 * await delay(1000);
 * console.log('Executed after 1 second');
 */
export function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Retry with Exponential Backoff
 * @param {Function} fn - Async function to retry
 * @param {number} maxRetries - Maximum retry attempts
 * @param {number} baseDelay - Base delay in ms
 * @returns {Promise} Result of function or throws error
 * 
 * @example
 * const result = await retryWithBackoff(
 *   () => fetch('/api/data'),
 *   3,
 *   1000
 * );
 */
export async function retryWithBackoff(fn, maxRetries = 3, baseDelay = 1000) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn()
    } catch (error) {
      if (i === maxRetries - 1) throw error
      const delayMs = baseDelay * Math.pow(2, i)
      await delay(delayMs)
    }
  }
}

/**
 * Input Sanitization
 * Prevent XSS and injection attacks
 */

/**
 * Sanitize HTML string - removes dangerous tags and attributes
 * @param {string} html - HTML string to sanitize
 * @returns {string} Sanitized HTML
 * 
 * @example
 * const safe = sanitizeHTML('<script>alert("xss")</script><p>Hello</p>');
 * // Returns: '<p>Hello</p>'
 */
export function sanitizeHTML(html) {
  const div = document.createElement('div')
  div.textContent = html
  return div.innerHTML
}

/**
 * Escape HTML special characters
 * @param {string} text - Text to escape
 * @returns {string} Escaped text
 * 
 * @example
 * const safe = escapeHTML('<script>alert("xss")</script>');
 * // Returns: '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;'
 */
export function escapeHTML(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
  }
  return text.replace(/[&<>"'/]/g, char => map[char])
}

/**
 * Validate and sanitize URL
 * @param {string} url - URL to validate
 * @param {string[]} allowedProtocols - Allowed protocols
 * @returns {string|null} Valid URL or null
 * 
 * @example
 * const url = sanitizeURL('javascript:alert("xss")');
 * // Returns: null
 * 
 * const safe = sanitizeURL('https://example.com');
 * // Returns: 'https://example.com'
 */
export function sanitizeURL(url, allowedProtocols = ['http:', 'https:']) {
  try {
    const parsed = new URL(url)
    if (allowedProtocols.includes(parsed.protocol)) {
      return url
    }
  } catch (e) {
    // Invalid URL
  }
  return null
}

/**
 * Safe JSON Operations
 */

/**
 * Safe JSON parse with fallback
 * @param {string} json - JSON string to parse
 * @param {any} fallback - Fallback value if parse fails
 * @returns {any} Parsed value or fallback
 * 
 * @example
 * const data = safeJSONParse(userInput, {});
 */
export function safeJSONParse(json, fallback = null) {
  try {
    return JSON.parse(json)
  } catch (e) {
    console.warn('JSON parse failed:', e)
    return fallback
  }
}

/**
 * Safe JSON stringify
 * @param {any} value - Value to stringify
 * @param {string} fallback - Fallback string if stringify fails
 * @returns {string} JSON string or fallback
 */
export function safeJSONStringify(value, fallback = '{}') {
  try {
    return JSON.stringify(value)
  } catch (e) {
    console.warn('JSON stringify failed:', e)
    return fallback
  }
}

/**
 * Safe Local Storage Operations
 */

/**
 * Safely get item from localStorage
 * @param {string} key - Storage key
 * @param {any} fallback - Fallback value
 * @returns {any} Stored value or fallback
 */
export function safeGetLocalStorage(key, fallback = null) {
  if (typeof window === 'undefined') return fallback
  try {
    const item = localStorage.getItem(key)
    return item ? JSON.parse(item) : fallback
  } catch (e) {
    console.warn('localStorage get failed:', e)
    return fallback
  }
}

/**
 * Safely set item in localStorage
 * @param {string} key - Storage key
 * @param {any} value - Value to store
 * @returns {boolean} Success status
 */
export function safeSetLocalStorage(key, value) {
  if (typeof window === 'undefined') return false
  try {
    localStorage.setItem(key, JSON.stringify(value))
    return true
  } catch (e) {
    console.warn('localStorage set failed:', e)
    return false
  }
}

/**
 * Safely remove item from localStorage
 * @param {string} key - Storage key
 * @returns {boolean} Success status
 */
export function safeRemoveLocalStorage(key) {
  if (typeof window === 'undefined') return false
  try {
    localStorage.removeItem(key)
    return true
  } catch (e) {
    console.warn('localStorage remove failed:', e)
    return false
  }
}

/**
 * Dynamic Import Helper (CSP-safe alternative to eval for loading modules)
 */

/**
 * Dynamically import a module (CSP-safe)
 * @param {string} modulePath - Path to module
 * @returns {Promise} Module
 * 
 * @example
 * const module = await safeDynamicImport('./utils/helper');
 */
export async function safeDynamicImport(modulePath) {
  try {
    return await import(modulePath)
  } catch (error) {
    console.error(`Failed to import module: ${modulePath}`, error)
    throw error
  }
}

/**
 * Form Validation Helpers
 */

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} Valid email
 */
export function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Validate password strength
 * @param {string} password - Password to validate
 * @returns {{valid: boolean, errors: string[]}} Validation result
 */
export function validatePassword(password) {
  const errors = []
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters')
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter')
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter')
  }
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number')
  }
  
  return {
    valid: errors.length === 0,
    errors
  }
}

/**
 * Rate Limiting Helper (Client-side)
 */

/**
 * Simple rate limiter
 * @param {string} key - Unique key for this action
 * @param {number} limit - Max attempts
 * @param {number} windowMs - Time window in ms
 * @returns {boolean} Whether action is allowed
 * 
 * @example
 * if (rateLimit('login', 5, 60000)) {
 *   // Proceed with login
 * } else {
 *   // Show "too many attempts" error
 * }
 */
export function rateLimit(key, limit, windowMs) {
  if (typeof window === 'undefined') return true
  
  const now = Date.now()
  const storageKey = `ratelimit_${key}`
  const stored = safeGetLocalStorage(storageKey, { count: 0, resetAt: now })
  
  if (now > stored.resetAt) {
    // Reset window
    safeSetLocalStorage(storageKey, { count: 1, resetAt: now + windowMs })
    return true
  }
  
  if (stored.count >= limit) {
    return false
  }
  
  stored.count++
  safeSetLocalStorage(storageKey, stored)
  return true
}

/**
 * NEVER USE THESE (Anti-patterns)
 */

// ❌ NEVER use eval()
// ❌ NEVER use new Function()
// ❌ NEVER use setTimeout/setInterval with strings
// ❌ NEVER use dangerouslySetInnerHTML without sanitization
// ❌ NEVER execute user input as code

/**
 * Instead, use:
 * - Function references for timers
 * - Dynamic imports for modules
 * - JSON.parse for data
 * - Template literals for strings
 * - React components for dynamic content
 */
