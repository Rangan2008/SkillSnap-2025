import jwt from 'jsonwebtoken';
import User from './models/User';
import connectDB from './db';

/**
 * Verify JWT token and get user
 * @param {string} token - JWT token from Authorization header
 * @returns {Promise<Object>} User object
 */
export const verifyToken = async (token) => {
  if (!token) {
    throw new Error('No token provided');
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Connect to database
    await connectDB();
    
    // Get user from token (exclude password)
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      throw new Error('User not found');
    }

    return user;
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('Token expired. Please login again.');
    }
    if (error.name === 'JsonWebTokenError') {
      throw new Error('Invalid token');
    }
    throw error;
  }
};

/**
 * Get user from request headers
 * @param {Request} request - Next.js request object
 * @returns {Promise<Object>} User object
 */
export const getUserFromRequest = async (request) => {
  const authHeader = request.headers.get('authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('No token provided. Authorization denied.');
  }

  const token = authHeader.split(' ')[1];
  return await verifyToken(token);
};

/**
 * Generate JWT token
 * @param {string} userId - User ID
 * @returns {string} JWT token
 */
export const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};
