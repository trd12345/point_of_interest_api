import { PrismaClient } from "../../generated/prisma/client";
import { emailChangeToken } from "../../lib/jwt";
import { sendMail } from "../../lib/mailer";
import { normalizeEmail } from "../../utils/string";
import jwt from "jsonwebtoken";

export class MeService {
    constructor(private db: PrismaClient) {
    }

    async getMe(id: string) {
        const user = await this.db.user.findUnique({
            where: { id },
            include: {
                profile: true,
                oauthAccount: true
            },
            omit: { password: true }
        });

        if (!user) throw new Error("USER_NOT_FOUND");

        // Map for frontend compatibility
        return {
            ...user,
            oauth_provider: user.oauthAccount?.provider || null,
            oauth_id: user.oauthAccount?.providerId || null
        };
    }

    async updateProfile(userId: string, data: { email: string; firstName: string; lastName: string; contactEmail?: string; contactPhone?: string }) {
        // Prepare update data
        const updateData: any = {
            first_name: data.firstName,
            last_name: data.lastName,
            contact_email: data.contactEmail || null,
            contact_phone: data.contactPhone || null
        };

        const user = await this.getMe(userId);
        const normalizedEmail = normalizeEmail(data.email);
        const isNewEmail = normalizedEmail !== user.email;

        if (isNewEmail) {
            const existingUser = await this.db.user.findUnique({
                where: { email: normalizedEmail }
            });
            if (existingUser) {
                throw new Error("EMAIL_TAKEN");
            }
        }

        // Update profile
        await this.db.user.update({
            where: { id: userId },
            data: {
                email: normalizedEmail,
                email_verified_at: isNewEmail ? null : user.email_verified_at,
                profile: {
                    update: updateData
                }
            }
        });

        if (isNewEmail) {
            await this.requestEmailChange(userId, normalizedEmail);
        }

        // Return updated user and status
        return {
            user: await this.getMe(userId),
            emailChangeRequested: isNewEmail
        };
    }

    async requestEmailChange(userId: string, newEmail: string) {
        const normalizedEmail = normalizeEmail(newEmail);

        const token = emailChangeToken({
            userId,
            newEmail: normalizedEmail
        });

        const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
        const verificationUrl = `${frontendUrl}/auth/verify-email-change?token=${token}`;

        await sendMail(
            normalizedEmail,
            "Confirm your email change",
            `
            <p>You requested to change your email to this address.</p>
            <p>Please click the link below to confirm the change:</p>
            <p><a href="${verificationUrl}">${verificationUrl}</a></p>
            `
        );

        return true;
    }

    async verifyEmailChange(token: string) {
        let decoded: { userId: string; newEmail: string };
        const secret = process.env.JWT_SECRET as string;

        try {
            decoded = jwt.verify(token, secret) as { userId: string; newEmail: string };
        } catch {
            throw new Error("INVALID_OR_EXPIRED_TOKEN");
        }

        const normalizedEmail = normalizeEmail(decoded.newEmail);

        await this.db.user.update({
            where: { id: decoded.userId },
            data: {
                email_verified_at: new Date() // Re-verify since they just confirmed the new email
            }
        });

        return this.getMe(decoded.userId);
    }

    async deleteAccount(userId: string) {
        // Transactional delete to ensure clean cleanup
        await this.db.$transaction(async (tx) => {
            // 1. Delete Refresh Tokens
            await tx.refreshToken.deleteMany({ where: { userId } });

            // 2. Delete Password Reset Tokens
            await tx.passwordReset.deleteMany({ where: { userId } });

            // 3. Delete Profile
            await tx.profile.delete({ where: { userId } });

            // 4. Delete Placemarks (Or could set userId to null if nullable)
            await tx.placemark.deleteMany({ where: { userId } });

            // 5. Delete User
            await tx.user.delete({ where: { id: userId } });
        });

        return true;
    }
} 