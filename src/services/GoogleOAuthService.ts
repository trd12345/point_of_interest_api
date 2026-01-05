import { OAuth2Client } from 'google-auth-library';
import { PrismaClient } from '../generated/prisma/client';
import bcrypt from 'bcrypt';

export class GoogleOAuthService {
    private client: OAuth2Client;

    constructor(private db: PrismaClient) {
        this.client = new OAuth2Client(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET,
            process.env.GOOGLE_CALLBACK_URL
        );
    }

    /**
     * Verify Google ID token and extract user information
     */
    async verifyGoogleToken(token: string) {
        try {
            const ticket = await this.client.verifyIdToken({
                idToken: token,
                audience: process.env.GOOGLE_CLIENT_ID,
            });

            const payload = ticket.getPayload();
            if (!payload) {
                throw new Error('Invalid token payload');
            }

            return {
                googleId: payload.sub,
                email: payload.email!,
                emailVerified: payload.email_verified || false,
                firstName: payload.given_name || '',
                lastName: payload.family_name || '',
                picture: payload.picture,
            };
        } catch (error) {
            throw new Error('Invalid Google token');
        }
    }

    /**
     * Find or create user from Google OAuth
     */
    async findOrCreateGoogleUser(googleProfile: {
        googleId: string;
        email: string;
        emailVerified: boolean;
        firstName: string;
        lastName: string;
    }) {
        let user = await this.db.user.findFirst({
            where: {
                oauthAccount: {
                    provider: 'google',
                    providerId: googleProfile.googleId,
                }
            },
            include: {
                profile: true,
                oauthAccount: true
            },
        });

        if (user) {
            return user;
        }

        // Check if user exists with this email (from email/password auth)
        const existingEmailUser = await this.db.user.findUnique({
            where: { email: googleProfile.email },
        });

        if (existingEmailUser) {
            // Email already exists with different auth method
            throw new Error(
                'An account with this email already exists. Please login with your email and password.'
            );
        }

        user = await this.db.user.create({
            data: {
                email: googleProfile.email,
                email_verified_at: googleProfile.emailVerified ? new Date() : null,
                password: null, // No password for OAuth users
                oauthAccount: {
                    create: {
                        provider: 'google',
                        providerId: googleProfile.googleId,
                    }
                },
                role: 'USER',
                profile: {
                    create: {
                        first_name: googleProfile.firstName,
                        last_name: googleProfile.lastName,
                    },
                },
            },
            include: {
                profile: true,
                oauthAccount: true
            },
        });

        return user;
    }
}
