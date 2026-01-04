import { Request, Response } from "express";
import { container } from "../lib/container";
import { z } from "zod";

const createCategorySchema = z.object({
    name: z.string().min(2),
    description: z.string().optional()
});

export const CategoryController = {
    // Handler to get all categories
    getAll: async (req: Request, res: Response) => {
        try {
            const categories = await container.categoryService.getAll();
            return res.json({
                success: true,
                message: "Categories retrieved successfully",
                data: {
                    categories,
                },
                errors: null,
            });
        } catch (e) {
            console.error(e);
            return res.status(500).json({
                success: false,
                message: "Failed to fetch categories",
                data: null,
                errors: ["Something went wrong"],
            });
        }
    },

    // Handler to create a new category
    create: async (req: Request, res: Response) => {
        const user = (req as any).user;
        // check if the user's role is admin or member
        if (user.role !== "ADMIN") return res.status(401).json({
            success: false,
            message: "Unauthorized",
            data: null,
            errors: ["Unauthorized"],
        });

        try {
            const parsed = createCategorySchema.safeParse(req.body);
            if (!parsed.success) {
                return res.status(422).json({
                    success: false,
                    message: "Validation failed",
                    data: null,
                    errors: parsed.error.issues.map((i) => i.message),
                });
            }

            const category = await container.categoryService.create(user.id, parsed.data);
            return res.status(201).json({
                success: true,
                message: "Category created successfully",
                data: {
                    category,
                },
                errors: null,
            });
        } catch (e) {
            console.error(e);
            return res.status(500).json({
                success: false,
                message: "Failed to create category",
                data: null,
                errors: ["Failed to create category"],
            });
        }
    },

    // Handler to delete a category
    delete: async (req: Request, res: Response) => {
        const user = (req as any).user;
        if (user.role !== "ADMIN") return res.status(403).json({
            success: false,
            message: "Forbidden",
            data: null,
            errors: ["Unauthorized"],
        });

        try {
            await container.categoryService.delete(req.params.id);
            return res.json({
                success: true,
                message: "Category deleted successfully",
                data: null,
                errors: null,
            });
        } catch (e) {
            console.error(e);
            return res.status(500).json({
                success: false,
                message: "Failed to delete category",
                data: null,
                errors: ["Failed to delete category"],
            });
        }
    }
};
