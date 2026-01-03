import connectDB from '@/lib/db';
import User from '@/lib/models/User';
import { generateToken } from '@/lib/authServer';
import { validateLogin } from '@/lib/validation';
import { handleError, createSuccessResponse, createErrorResponse } from '@/lib/errors';

// ✅ VERCEL: Use Node.js runtime (required for mongoose)
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/auth/login
 * Login user
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    // Validate input
    const validation = validateLogin({ email, password });
    if (!validation.valid) {
      console.error('❌ Validation failed:', validation.errors);
      return createErrorResponse(validation.errors.join(', '), 400);
    }

    // Connect to database
    await connectDB();
    console.log('✅ Database connected for login');

    // Find user and include password
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    
    if (!user) {
      console.error('❌ User not found:', email);
      return createErrorResponse('Invalid email or password', 401);
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    
    if (!isPasswordValid) {
      console.error('❌ Invalid password for user:', email);
      return createErrorResponse('Invalid email or password', 401);
    }

    // Generate token
    const token = generateToken(user._id);
    console.log('✅ Login successful for:', email);

    return createSuccessResponse(
      {
        user: {
          id: user._id,
          email: user.email,
          fullName: user.fullName,
          jobPreferences: user.jobPreferences,
          currentCourse: user.currentCourse
        },
        token
      },
      'Login successful'
    );
    
  } catch (error) {
    console.error('❌ Login error:', error);
    const errorResponse = handleError(error);
    return new Response(JSON.stringify(errorResponse.body), {
      status: errorResponse.status,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
