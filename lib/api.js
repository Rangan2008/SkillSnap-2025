// Authenticated API client utility for Next.js API routes

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api';

/**
 * Get JWT token from localStorage
 */
function getToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
}

/**
 * Save JWT token to localStorage
 */
export function saveToken(token) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('token', token);
}

/**
 * Remove JWT token from localStorage
 */
export function removeToken() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('token');
  localStorage.removeItem('user');
}

/**
 * Authenticated fetch wrapper with automatic token injection
 * @param {string} endpoint - API endpoint (e.g., '/auth/profile')
 * @param {object} options - Fetch options
 * @returns {Promise<Response>}
 */
export async function apiFetch(endpoint, options = {}) {
  const token = getToken();

  const headers = {
    ...options.headers,
  };

  // Add Authorization header if token exists
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Add Content-Type header for JSON payloads (except FormData)
  if (options.body && !(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  // Handle 401 Unauthorized - redirect to login
  if (response.status === 401) {
    removeToken();
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
    throw new Error('Unauthorized - please log in again');
  }

  return response;
}

/**
 * Helper: Parse JSON response with error handling
 */
export async function apiJson(endpoint, options = {}) {
  const response = await apiFetch(endpoint, options);

  // Check if response has content
  const contentType = response.headers.get('content-type');
  if (!contentType || !contentType.includes('application/json')) {
    const text = await response.text();
    console.error('Non-JSON response:', text);
    throw new Error(`API returned non-JSON response: ${text.substring(0, 100)}`);
  }

  // Check if response is empty
  const text = await response.text();
  if (!text || text.trim() === '') {
    throw new Error('API returned empty response');
  }

  let data;
  try {
    data = JSON.parse(text);
  } catch (e) {
    console.error('JSON parse error:', e, 'Response:', text);
    throw new Error('Invalid JSON response from API');
  }

  if (!response.ok) {
    // Extract detailed error message if available
    const errorMsg = data.details
      ? `${data.error}: ${data.details.map(d => d.message).join(', ')}`
      : (data.error || data.message || 'Request failed');
    throw new Error(errorMsg);
  }

  return data;
}

/**
 * Auth API calls
 */
export const authApi = {
  // Email/password registration
  register: async (fullName, email, password) => {
    return apiJson('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ fullName, email, password }),
    });
  },

  // Email/password login
  login: async (email, password) => {
    return apiJson('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  // Google Sign-In with Firebase token
  googleLogin: async (firebaseToken) => {
    return apiJson('/auth/google', {
      method: 'POST',
      body: JSON.stringify({ firebaseToken }),
    });
  },

  // Get current user profile
  getProfile: async () => {
    return apiJson('/auth/profile');
  },

  // Update user profile
  updateProfile: async (updates) => {
    return apiJson('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  // Upload profile picture
  uploadProfilePicture: async (file) => {
    const formData = new FormData();
    formData.append('profilePicture', file);

    return apiJson('/auth/profile-picture', {
      method: 'POST',
      body: formData,
    });
  },
};

/**
 * Resume Analysis API calls
 */
export const resumeApi = {
  // ✅ NEW: Analyze resume and JD from extracted text
  analyzeWithJD: async ({ resumeText, jdText, resumeFileName, jdFileName, resumeFileSize, jdFileSize }) => {
    return apiJson('/resume/analyze', {
      method: 'POST',
      body: JSON.stringify({
        resumeText,
        jdText,
        resumeFileName,
        jdFileName,
        resumeFileSize,
        jdFileSize
      }),
    });
  },

  // ✅ PREVIOUS: Analyze resume from extracted text (Vercel-safe)
  // Client sends ONLY text, backend never parses PDF
  analyzeText: async ({ resumeText, fileName, fileSize, jobRole, experienceLevel, jobDescription = '' }) => {
    return apiJson('/resume/analyze', {
      method: 'POST',
      body: JSON.stringify({
        resumeText,
        fileName,
        fileSize,
        jobRole,
        experienceLevel,
        jobDescription
      }),
    });
  },

  // ⚠️ DEPRECATED: Old file upload method (kept for backward compatibility)
  // Upload and analyze resume
  analyze: async (file, jobRole, experienceLevel, jobDescription = '') => {
    const formData = new FormData();
    formData.append('resume', file);
    formData.append('jobRole', jobRole);
    formData.append('experienceLevel', experienceLevel);
    if (jobDescription) {
      formData.append('jobDescription', jobDescription);
    }

    return apiJson('/resume/analyze', {
      method: 'POST',
      body: formData,
    });
  },

  // Get single analysis by ID
  getAnalysis: async (analysisId) => {
    return apiJson(`/resume-analysis/${analysisId}`);
  },

  // Get all analyses for current user
  getAllAnalyses: async (options = {}) => {
    const params = new URLSearchParams();
    if (options.all) params.append('all', 'true');
    if (options.page) params.append('page', options.page);
    if (options.limit) params.append('limit', options.limit);

    const queryString = params.toString();
    return apiJson(`/resume-analysis${queryString ? '?' + queryString : ''}`);
  },

  // Delete analysis by ID
  deleteAnalysis: async (analysisId) => {
    return apiJson(`/resume-analysis/${analysisId}`, {
      method: 'DELETE',
    });
  },
};

/**
 * Roadmap API calls
 */
export const roadmapApi = {
  // Get roadmap for analysis
  getRoadmap: async (analysisId) => {
    return apiJson(`/roadmap/${analysisId}`);
  },

  // Update single step progress
  updateStepProgress: async (analysisId, stepId, status, progressPercent, notes = '') => {
    return apiJson(`/roadmap/progress/${analysisId}`, {
      method: 'PATCH',
      body: JSON.stringify({ stepId, status, progressPercent, notes }),
    });
  },

  // Bulk update multiple steps
  bulkUpdateProgress: async (analysisId, updates) => {
    return apiJson(`/roadmap/progress/${analysisId}/bulk`, {
      method: 'PATCH',
      body: JSON.stringify({ updates }),
    });
  },
};

/**
 * Progress Tracking API calls
 */
export const progressApi = {
  // Log a resource click
  logResourceClick: async (progressData) => {
    return apiJson('/progress', {
      method: 'POST',
      body: JSON.stringify(progressData),
    });
  },

  // Get latest progress
  getLatestProgress: async () => {
    return apiJson('/progress/latest');
  },

  // Get progress history (optional - for future use)
  getProgressHistory: async (limit = 10) => {
    return apiJson(`/progress/history?limit=${limit}`);
  },
};
