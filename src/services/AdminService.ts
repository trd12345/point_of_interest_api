import { PrismaClient } from "../generated/prisma/client";

export class AdminService {
    constructor(private db: PrismaClient) { }

    async getAllUsers() {
        const users = await this.db.user.findMany({
            include: { profile: true },
            orderBy: { created_at: "desc" },
        });

        return users.map((user: any) => {
            const { password, ...rest } = user;
            return rest;
        });
    }

    async deleteUser(userId: string) {
        return this.db.$transaction(async (tx) => {
            // 1. Delete OAuth Account
            await tx.oAuthAccount.deleteMany({ where: { userId } });

            // 2. Delete Profile
            await tx.profile.deleteMany({ where: { userId } });

            // 3. Delete related data that might have complex relations or need manual handling
            // NOTE: Most of these are now handled by onDelete: Cascade in schema.prisma,
            // but we keep some manual steps for safety or specific logic if needed.

            // Example: If we want to delete reviews specifically before the user,
            // although onDelete: Cascade on Review.user will handle it.

            // 4. Delete User (This triggers cascades for RefreshToken, PasswordReset, Placemark, Category, Review)
            return tx.user.delete({ where: { id: userId } });
        });
    }

    async updateUserRole(userId: string, role: string) {
        const user = await this.db.user.update({
            where: { id: userId },
            data: { role },
            include: { profile: true },
        });

        const { password: _, ...rest } = user;
        return rest;
    }
}
