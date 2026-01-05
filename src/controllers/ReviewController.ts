import { Request, Response } from "express";
import { container } from "../lib/container";
import { z } from "zod";

const createReviewSchema = z.object({
    placemarkId: z.string().min(1),
    rating: z.number().min(1).max(5).optional(),
    comment: z.string().min(1),
    parentId: z.string().optional()
});

export const ReviewController = {
    create: async (req: Request, res: Response) => {
        const user = (req as any).user;
        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized",
                data: null,
                errors: ["You must be logged in to leave a review"]
            });
        }

        try {
            const parsed = createReviewSchema.safeParse(req.body);
            if (!parsed.success) {
                return res.status(400).json({
                    success: false,
                    message: "Validation failed",
                    data: null,
                    errors: (parsed as any).error.errors.map((e: any) => e.message)
                });
            }

            const review = await container.reviewService.createReview({
                ...parsed.data,
                userId: user.id
            });

            return res.status(201).json({
                success: true,
                message: "Review created successfully",
                data: { review },
                errors: null
            });
        } catch (e: any) {
            console.error(e);
            let status = 500;
            if (e.message.includes("not found")) status = 404;
            if (e.message.includes("cannot review your own spot")) status = 403;
            if (e.message.includes("Invalid parent")) status = 400;

            return res.status(status).json({
                success: false,
                message: e.message || "Failed to create review",
                data: null,
                errors: [e.message]
            });
        }
    },

    delete: async (req: Request, res: Response) => {
        const user = (req as any).user;
        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized",
                data: null,
                errors: ["You must be logged in to delete a review"]
            });
        }

        try {
            await container.reviewService.deleteReview(
                req.params.id,
                user.id,
                user.role === "ADMIN"
            );

            return res.json({
                success: true,
                message: "Review deleted successfully",
                data: null,
                errors: null
            });
        } catch (e: any) {
            console.error(e);
            let status = 500;
            if (e.message.includes("Review not found")) status = 404;
            if (e.message.includes("Unauthorized")) status = 403;
            if (e.message.includes("Malformed ObjectID")) status = 400; // Handle Prisma/Mongo errors

            return res.status(status).json({
                success: false,
                message: e.message || "Failed to delete review",
                data: null,
                errors: [e.message]
            });
        }
    },

    getByPlacemark: async (req: Request, res: Response) => {
        try {
            const reviews = await container.reviewService.getReviewsByPlacemark(req.params.placemarkId);
            return res.json({
                success: true,
                message: "Reviews retrieved successfully",
                data: { reviews },
                errors: null
            });
        } catch (e: any) {
            console.error(e);
            return res.status(500).json({
                success: false,
                message: "Failed to fetch reviews",
                data: null,
                errors: [e.message]
            });
        }
    }
};
