import { PrismaClient } from "../generated/prisma/client";

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

    // Get a specific placemark by ID and optionally increment view count
    async getById(id: string, viewerId?: string) {
        const placemark = await this.db.placemark.findUnique({
            where: { id },
            include: {
                user: {
                    select: {
                        id: true,
                        profile: {
                            select: {
                                first_name: true,
                                last_name: true
                            }
                        }
                    }
                },
                category: {
                    select: {
                        id: true,
                        name: true,
                        description: true
                    }
                }
            }
        });

        if (!placemark) return null;

        // Only increment if viewer is not the owner
        if (viewerId !== placemark.userId) {
            return await this.db.placemark.update({
                where: { id },
                data: { view_count: { increment: 1 } },
                include: {
                    user: {
                        select: {
                            id: true,
                            profile: {
                                select: {
                                    first_name: true,
                                    last_name: true
                                }
                            }
                        }
                    },
                    category: {
                        select: {
                            id: true,
                            name: true,
                            description: true
                        }
                    }
                }
            });
        }

        return placemark;
    }

    // Create a new placemark linked to a user
    async create(userId: string, data: {
        name: string;
        description?: string;
        categoryId: string;
        street: string;
        house_number?: string;
        zip: number;
        city: string;
        country: string;
        lat: number;
        lng: number;
        image_url?: string;
        is_public?: boolean;
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
        image_url?: string | null;
        is_public?: boolean;
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

    // Delete a placemark (only if owned by the user or admin)
    async delete(userId: string, placemarkId: string, isAdmin: boolean = false) {
        // Ensure ownership
        const placemark = await this.db.placemark.findUnique({ where: { id: placemarkId } });
        if (!placemark) throw new Error("NOT_FOUND");

        if (!isAdmin && placemark.userId !== userId) throw new Error("FORBIDDEN");

        return this.db.placemark.delete({
            where: { id: placemarkId }
        });
    }
} 
