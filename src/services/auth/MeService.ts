import { PrismaClient } from "../../../generated/prisma/client";

export class MeService {
    constructor(private db: PrismaClient) {
    }

    async getMe(id: string) {
        const user = await this.db.user.findUnique({
            where: { id },
            include: { profile: true },
            omit: { password: true }
        });

        if (!user) throw new Error("USER_NOT_FOUND");

        return user;
    }

    async updateProfile(userId: string, data: { firstName?: string; lastName?: string }) {
        // Prepare update data
        const updateData: any = {};
        if (data.firstName) updateData.first_name = data.firstName;
        if (data.lastName) updateData.last_name = data.lastName;

        if (Object.keys(updateData).length === 0) return true; // Nothing to update

        // Update profile
        await this.db.profile.update({
            where: { userId },
            data: updateData
        });

        // Return updated user
        return this.getMe(userId);
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