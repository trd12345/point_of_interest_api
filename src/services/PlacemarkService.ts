import { PrismaClient } from "../generated/prisma/client";

/**
 * Service to handle Placemark (camping spot) operations.
 */
export class PlacemarkService {
    constructor(private db: PrismaClient) {
    }

    // Get all placemarks including host and category details (Scrubbed for privacy)
    async getAll() {
        return this.db.placemark.findMany({
            select: {
                id: true,
                name: true,
                description: true,
                city: true,
                country: true,
                image_url: true,
                view_count: true,
                categoryId: true,
                is_public: true,
                userId: true,
                created_at: true,
                updated_at: true,
                // Exclude sensitive details: street, house_number, lat, lng, zip
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
                category: true
            }
        });
    }

    // Get a specific placemark by ID and optionally increment view count
    async getById(id: string, viewerId?: string, isAdmin: boolean = false) {
        let placemark = await this.db.placemark.findUnique({
            where: { id },
            include: {
                user: {
                    select: {
                        id: true,
                        profile: {
                            select: {
                                first_name: true,
                                last_name: true,
                                contact_email: true,
                                contact_phone: true
                            }
                        }
                    }
                },
                category: true
            }
        });

        if (!placemark) return null;

        // Scrub sensitive address if viewer is not the owner and not an admin
        if (viewerId !== placemark.userId && !isAdmin) {
            (placemark as any).street = "[HIDDEN]";
            (placemark as any).house_number = "";
        }

        // Only increment if viewer is not the owner
        if (viewerId !== placemark.userId) {
            placemark = await this.db.placemark.update({
                where: { id },
                data: { view_count: { increment: 1 } },
                include: {
                    user: {
                        select: {
                            id: true,
                            profile: {
                                select: {
                                    first_name: true,
                                    last_name: true,
                                    contact_email: true,
                                    contact_phone: true
                                }
                            }
                        }
                    },
                    category: true
                }
            });

            // Re-apply scrubbing after update
            if (viewerId !== (placemark as any).userId && !isAdmin) {
                (placemark as any).street = "[HIDDEN]";
                (placemark as any).house_number = "";
            }
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
