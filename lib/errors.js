/**
 * Error handling utilities for Next.js API routes
 */

/**
 * Create a standardized error response
 * @param {Error} error - Error object
 * @returns {Object} Error response object
 */
export const handleError = (error) => {
  console.error('API Error:', error);

  // Mongoose validation error
  if (error.name === 'ValidationError') {
    const errors = Object.values(error.errors).map(e => e.message);
    return {
      status: 400,
      body: {
        success: false,
        error: 'Validation failed',
        details: errors
      }
    };
  }

  // Mongoose duplicate key error
  if (error.code === 11000) {
    const field = Object.keys(error.keyPattern || {})[0] || 'field';
    return {
      status: 400,
      body: {
        success: false,
        error: `${field} already exists`
      }
    };
  }

  // Mongoose cast error (invalid ObjectId)
  if (error.name === 'CastError') {
    return {
      status: 400,
      body: {
        success: false,
        error: 'Invalid ID format'
      }
    };
  }

  // JWT errors
  if (error.name === 'JsonWebTokenError') {
    return {
      status: 401,
      body: {
        success: false,
        error: 'Invalid token'
      }
    };
  }

  if (error.name === 'TokenExpiredError') {
    return {
      status: 401,
      body: {
        success: false,
        error: 'Token expired'
      }
    };
  }

  // Authentication errors
  if (error.message.includes('token') || error.message.includes('Authorization')) {
    return {
      status: 401,
      body: {
        success: false,
        error: error.message
      }
    };
  }

  // Default error
  return {
    status: error.statusCode || 500,
    body: {
      success: false,
      error: error.message || 'Server error',
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    }
  };
};

/**
 * Create a success response
 * @param {Object} data - Response data
 * @param {string} message - Success message
 * @param {number} status - HTTP status code
 * @returns {Response} Next.js Response object
 */
export const createSuccessResponse = (data, message = null, status = 200) => {
  const body = {
    success: true,
    ...(message && { message }),
    ...(data && { data })
  };

  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
    },
  });
};

/**
 * Create an error response
 * @param {string} error - Error message
 * @param {number} status - HTTP status code
 * @returns {Response} Next.js Response object
 */
export const createErrorResponse = (error, status = 500) => {
  return new Response(
    JSON.stringify({
      success: false,
      error
    }),
    {
      status,
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );
};
