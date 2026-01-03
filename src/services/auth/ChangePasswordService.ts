import { PrismaClient } from "../../generated/prisma/client";
import bcrypt from "bcrypt";

/**
 * Service to handle changing the password for a logged-in user.
 */
export class ChangePasswordService {
    constructor(private db: PrismaClient) {
    }

    async changePassword(userId: string, data: { oldPassword: string, newPassword: string }) {
        const user = await this.db.user.findUnique({
            where: { id: userId }
        });

        if (!user) {
            throw new Error("USER_NOT_FOUND");
        }

        // 1. Verify old password
        const valid = await bcrypt.compare(data.oldPassword, user.password);
        if (!valid) {
            throw new Error("INVALID_PASSWORD");
        }

        // 2. Hash new password
        const hashedPassword = await bcrypt.hash(data.newPassword, 10);

        // 3. Update password
        await this.db.user.update({
            where: { id: userId },
            data: { password: hashedPassword }
        });

        // 4. Revoke sessions
        // Revoke all for now to force re-login on all devices
        await this.db.refreshToken.deleteMany({
            where: { userId: userId }
        });

        return true;
    }
} 
