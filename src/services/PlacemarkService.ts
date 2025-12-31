import { PrismaClient } from "../../generated/prisma/client";

/**
 * Service to handle Placemark (camping spot) operations.
 */
export class PlacemarkService {
    constructor(private db: PrismaClient) {
    }

    // Get all placemarks including host and category details
    async getAll() {
        return this.db.placemark.findMany({
            include: {
                user: {
                    select: {
                        id: true,
                        profile: true
                    }
                },
                category: true
            }
        });
    }

    // Get a specific placemark by ID and increment analytics view count
    async getById(id: string) {
        // Increment view count atomically
        const placemark = await this.db.placemark.update({
            where: { id },
            data: { view_count: { increment: 1 } },
            include: {
                user: {
                    select: {
                        id: true,
                        profile: true
                    }
                },
                category: true
            }
        });
        return placemark;
    }

    // Create a new placemark linked to a user
    async create(userId: string, data: {
        name: string;
        description?: string;
        categoryId: string;
        street: string;
        house_number: string;
        zip: number;
        city: string;
        country: string;
        lat: number;
        lng: number;
        image_url?: string;
    }) {
        return this.db.placemark.create({
            data: {
                ...data,
                userId
            }
        });
    }

    // Update a placemark (only if owned by the user)
    async update(userId: string, placemarkId: string, data: Partial<{
        name: string;
        description: string;
        categoryId: string;
        street: string;
        house_number: string;
        zip: number;
        city: string;
        country: string;
        lat: number;
        lng: number;
        is_public: boolean;
    }>) {
        // Ensure ownership
        const placemark = await this.db.placemark.findUnique({ where: { id: placemarkId } });
        if (!placemark) throw new Error("NOT_FOUND");
        if (placemark.userId !== userId) throw new Error("FORBIDDEN");

        return this.db.placemark.update({
            where: { id: placemarkId },
            data
        });
    }

    // Delete a placemark (only if owned by the user)
    async delete(userId: string, placemarkId: string) {
        // Ensure ownership
        const placemark = await this.db.placemark.findUnique({ where: { id: placemarkId } });
        if (!placemark) throw new Error("NOT_FOUND");
        if (placemark.userId !== userId) throw new Error("FORBIDDEN");

        return this.db.placemark.delete({
            where: { id: placemarkId }
        });
    }
} 
