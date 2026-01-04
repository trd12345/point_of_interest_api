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
            // 1. Delete Refresh Tokens
            await tx.refreshToken.deleteMany({ where: { userId } });

            // 2. Delete Password Reset Tokens
            await tx.passwordReset.deleteMany({ where: { userId } });

            // 3. Delete Placemarks
            await tx.placemark.deleteMany({ where: { userId } });

            // 4. Delete Categories (optional: or reassign to another admin)
            await tx.category.deleteMany({ where: { userId } });

            // 5. Delete Profile
            await tx.profile.deleteMany({ where: { userId } });

            // 6. Delete User
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
