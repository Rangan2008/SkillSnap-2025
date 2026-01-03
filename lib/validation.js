/**
 * Validation utilities for Next.js API routes
 */

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean}
 */
export const isValidEmail = (email) => {
  const emailRegex = /^\S+@\S+\.\S+$/;
  return emailRegex.test(email);
};

/**
 * Validate MongoDB ObjectId
 * @param {string} id - ID to validate
 * @returns {boolean}
 */
export const isValidObjectId = (id) => {
  return /^[0-9a-fA-F]{24}$/.test(id);
};

/**
 * Validate registration data
 * @param {Object} data - Registration data
 * @returns {Object} Validation result { valid: boolean, errors: string[] }
 */
export const validateRegistration = (data) => {
  const errors = [];

  if (!data.email || !isValidEmail(data.email)) {
    errors.push('Please provide a valid email address');
  }

  if (!data.password || data.password.length < 6) {
    errors.push('Password must be at least 6 characters long');
  }

  if (!data.fullName || data.fullName.trim().length < 2 || data.fullName.trim().length > 100) {
    errors.push('Full name must be between 2 and 100 characters');
  }

  return {
    valid: errors.length === 0,
    errors
  };
};

/**
 * Validate login data
 * @param {Object} data - Login data
 * @returns {Object} Validation result
 */
export const validateLogin = (data) => {
  const errors = [];

  if (!data.email || !isValidEmail(data.email)) {
    errors.push('Please provide a valid email address');
  }

  if (!data.password) {
    errors.push('Password is required');
  }

  return {
    valid: errors.length === 0,
    errors
  };
};

/**
 * Validate resume analysis request
 * @param {Object} data - Analysis request data
 * @returns {Object} Validation result
 */
export const validateResumeAnalysis = (data) => {
  const errors = [];
  const validLevels = ['intern', 'entry', 'mid', 'senior'];

  if (!data.jobRole || data.jobRole.trim().length === 0) {
    errors.push('Job role is required');
  }

  if (!data.experienceLevel || !validLevels.includes(data.experienceLevel)) {
    errors.push('Experience level must be intern, entry, mid, or senior');
  }

  return {
    valid: errors.length === 0,
    errors
  };
};

/**
 * Validate progress update data
 * @param {Object} data - Progress update data
 * @returns {Object} Validation result
 */
export const validateProgressUpdate = (data) => {
  const errors = [];
  const validStatuses = ['not_started', 'in_progress', 'completed'];

  if (!data.stepId) {
    errors.push('Step ID is required');
  }

  if (!data.status || !validStatuses.includes(data.status)) {
    errors.push('Status must be not_started, in_progress, or completed');
  }

  if (data.progressPercent !== undefined) {
    const percent = parseInt(data.progressPercent);
    if (isNaN(percent) || percent < 0 || percent > 100) {
      errors.push('Progress percent must be between 0 and 100');
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
};
