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

            // 3. Get all placemarks owned by this user
            const userPlacemarks = await tx.placemark.findMany({
                where: { userId },
                select: { id: true }
            });
            const placemarkIds = userPlacemarks.map(p => p.id);

            // 4. Delete all review replies (child reviews) on those placemarks first
            if (placemarkIds.length > 0) {
                await tx.review.deleteMany({
                    where: {
                        placemarkId: { in: placemarkIds },
                        parentId: { not: null }
                    }
                });

                // 5. Delete all parent reviews on those placemarks
                await tx.review.deleteMany({
                    where: {
                        placemarkId: { in: placemarkIds }
                    }
                });
            }

            // 6. Delete review replies created by this user
            await tx.review.deleteMany({
                where: {
                    userId,
                    parentId: { not: null }
                }
            });

            // 7. Delete reviews created by this user
            await tx.review.deleteMany({ where: { userId } });

            // 8. Delete Placemarks
            await tx.placemark.deleteMany({ where: { userId } });

            // 9. Delete Categories
            await tx.category.deleteMany({ where: { userId } });

            // 10. Delete Profile
            await tx.profile.deleteMany({ where: { userId } });

            // 11. Delete User
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
