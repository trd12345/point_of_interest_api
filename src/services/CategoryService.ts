import { PrismaClient } from "../../generated/prisma/client";

/**
 * Service to handle Category operations.
 */
export class CategoryService {
    constructor(private db: PrismaClient) {
    }

    // Get all categories
    async getAll() {
        return this.db.category.findMany();
    }

    // Create a new category
    async create(data: { name: string; description?: string }) {
        return this.db.category.create({
            data
        });
    }

    // Delete a category by ID
    async delete(id: string) {
        // Optional: Check if used by any placemark before delete
        return this.db.category.delete({
            where: { id }
        });
    }
}
