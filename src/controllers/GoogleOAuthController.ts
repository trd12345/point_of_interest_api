import { Request, Response } from 'express';
import { container } from '../lib/container';
import jwt from 'jsonwebtoken';

export const GoogleOAuthController = {
    /**
     * Handle Google OAuth callback
     * Expects: { token: string } in request body (Google ID token from frontend)
     */
    googleAuth: async (req: Request, res: Response) => {
        try {
            const { token } = req.body;

            if (!token) {
                return res.status(400).json({
                    success: false,
                    message: 'Google token is required',
                    data: null,
                    errors: { token: ['Token is required'] },
                });
            }

            // Verify Google token and get user info
            const googleProfile = await container.googleOAuthService.verifyGoogleToken(token);

            // Find or create user
            const user = await container.googleOAuthService.findOrCreateGoogleUser(googleProfile);

            // Generate JWT token
            const jwtSecret = process.env.JWT_SECRET;
            if (!jwtSecret) {
                throw new Error('JWT_SECRET is not configured');
            }

            const accessToken = jwt.sign(
                {
                    id: user.id,
                    email: user.email,
                    role: user.role,
                },
                jwtSecret,
                { expiresIn: '30m' }
            );

            // Remove password from response
            const { password, ...userWithoutPassword } = user;

            return res.json({
                success: true,
                message: 'Google authentication successful',
                data: {
                    user: userWithoutPassword,
                    access_token: accessToken,
                },
                errors: null,
            });
        } catch (error: any) {

            // Handle specific error messages
            if (error.message.includes('already exists')) {
                return res.status(409).json({
                    success: false,
                    message: error.message,
                    data: null,
                    errors: { email: [error.message] },
                });
            }

            return res.status(500).json({
                success: false,
                message: 'Google authentication failed',
                data: null,
                errors: { general: [error.message || 'Something went wrong'] },
            });
        }
    },
};
