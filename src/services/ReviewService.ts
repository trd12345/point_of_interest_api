import { PrismaClient } from "../generated/prisma/client";

export class ReviewService {
    private prisma: PrismaClient;

    constructor(prisma: PrismaClient) {
        this.prisma = prisma;
    }

    async createReview(data: {
        userId: string;
        placemarkId: string;
        rating?: number;
        comment: string;
        parentId?: string;
    }) {
        // If it's a review (not a reply), check if the user is the owner
        const placemark = await this.prisma.placemark.findUnique({
            where: { id: data.placemarkId }
        });

        if (!placemark) throw new Error("Spot not found");

        if (!data.parentId && placemark.userId === data.userId) {
            throw new Error("You cannot review your own spot");
        }

        // If it's a reply, ensure the parent exists and is on the same placemark
        if (data.parentId) {
            const parent = await this.prisma.review.findUnique({
                where: { id: data.parentId }
            });

            if (!parent || parent.placemarkId !== data.placemarkId) {
                throw new Error("Invalid parent review");
            }
        }

        return this.prisma.review.create({
            data: {
                userId: data.userId,
                placemarkId: data.placemarkId,
                rating: data.rating,
                comment: data.comment,
                parentId: data.parentId ?? null,
            },
            include: {
                user: {
                    include: {
                        profile: true
                    }
                }
            }
        });
    }

    async deleteReview(reviewId: string, userId: string, isAdmin: boolean) {
        const review = await this.prisma.review.findUnique({
            where: { id: reviewId },
            include: { placemark: true }
        });

        if (!review) {
            throw new Error("Review not found");
        }

        // Only the author, the host of the placemark, or an admin can delete
        const isAuthor = review.userId === userId;
        const isHost = review.placemark.userId === userId;

        if (!isAuthor && !isHost && !isAdmin) {
            throw new Error("Unauthorized to delete this review");
        }

        return this.prisma.review.delete({
            where: { id: reviewId }
        });
    }

    async getReviewsByPlacemark(placemarkId: string) {
        return this.prisma.review.findMany({
            where: {
                placemarkId,
                parentId: null
            },
            include: {
                user: {
                    include: {
                        profile: true
                    }
                },
                replies: {
                    include: {
                        user: {
                            include: {
                                profile: true
                            }
                        }
                    }
                }
            },
            orderBy: {
                created_at: "desc"
            }
        });
    }
}
