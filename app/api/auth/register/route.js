import connectDB from '@/lib/db';
import User from '@/lib/models/User';
import { generateToken } from '@/lib/authServer';
import { validateRegistration } from '@/lib/validation';
import { handleError, createSuccessResponse, createErrorResponse } from '@/lib/errors';

// ✅ VERCEL: Use Node.js runtime (required for mongoose)
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/auth/register
 * Register a new user
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { email, password, fullName } = body;

    // Validate input
    const validation = validateRegistration({ email, password, fullName });
    if (!validation.valid) {
      return createErrorResponse(validation.errors.join(', '), 400);
    }

    // Connect to database
    await connectDB();

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return createErrorResponse('Email already registered', 400);
    }

    // Create user
    const user = await User.create({
      email: email.toLowerCase(),
      password,
      fullName
    });

    // Generate token
    const token = generateToken(user._id);

    return createSuccessResponse(
      {
        user: {
          id: user._id,
          email: user.email,
          fullName: user.fullName,
          createdAt: user.createdAt
        },
        token
      },
      'Registration successful',
      201
    );
    
  } catch (error) {
    const errorResponse = handleError(error);
    return new Response(JSON.stringify(errorResponse.body), {
      status: errorResponse.status,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
