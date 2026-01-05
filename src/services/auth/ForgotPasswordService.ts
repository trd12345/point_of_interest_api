import { PrismaClient } from "../../generated/prisma/client";
import { passwordToken } from "../../lib/jwt";
import { sendMail } from "../../lib/mailer";

export class ForgotPasswordService {
    constructor(private db: PrismaClient) {
    }

    async forgotPassword(data: { email: string }) {
        const user = await this.db.user.findUnique({
            where: { email: data.email },
            include: { profile: true }
        });

        if (!user) {
            throw new Error("USER_NOT_FOUND");
        }

        if (user.oauth_provider === 'google') {
            throw new Error("GOOGLE_ACCOUNT_ERROR");
        }

        const token = passwordToken({
            userId: user.id,
            email: user.email
        });

        await this.db.passwordReset.create({
            data: {
                userId: user.id,
                token: token
            }
        });

        const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
        const resetLink = `${frontendUrl}/reset-password?token=${token}`;

        await sendMail(
            user.email,
            "Reset your password",
            `
            <p>Hello ${user.profile?.first_name || 'User'},</p>
            <p>You requested a password reset. Click the link below to reset your password:</p>
            <p><a href="${resetLink}">Reset Password</a></p>
            `
        );
    }
}
