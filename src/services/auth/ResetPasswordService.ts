import { PrismaClient } from "../../generated/prisma/client";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

export class ResetPasswordService {
    constructor(private db: PrismaClient) {
    }

    async resetPassword(data: { token: string, password: string }) {
        let decoded: { userId: string; email: string };

        // 1. Verify JWT token
        try {
            decoded = jwt.verify(
                data.token,
                process.env.JWT_SECRET as string
            ) as { userId: string; email: string };
        } catch (e) {
            throw new Error("INVALID_OR_EXPIRED_TOKEN");
        }

        // 2. Check if token exists in DB
        const storedToken = await this.db.passwordReset.findUnique({
            where: { token: data.token }
        });

        if (!storedToken) {
            throw new Error("INVALID_OR_EXPIRED_TOKEN");
        }

        // 3. Get user and check if they are a Google user
        const user = await this.db.user.findUnique({
            where: { id: decoded.userId }
        });

        if (user?.oauth_provider === 'google') {
            throw new Error("GOOGLE_ACCOUNT_ERROR");
        }

        // 4. Hash new password
        const hashedPassword = await bcrypt.hash(data.password, 10);

        // 5. Update User password and Delete used token
        // Use transaction to ensure atomicity
        await this.db.$transaction([
            this.db.user.update({
                where: { id: decoded.userId },
                data: { password: hashedPassword }
            }),
            this.db.passwordReset.delete({
                where: { id: storedToken.id }
            }),
            // 5. Revoke all active sessions (Refresh Tokens) for security
            // This forces the user to log in again on all devices with the new password
            this.db.refreshToken.deleteMany({
                where: { userId: decoded.userId }
            })
        ]);

        return true;
    }
} 
