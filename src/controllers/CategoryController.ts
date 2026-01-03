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
        const categories = await container.categoryService.getAll();
        return res.json(categories);
    },

    // Handler to create a new category
    create: async (req: Request, res: Response) => {
        const user = (req as any).user;
        // check if the user's role is admin or member
        if (user.role !== "ADMIN") return res.status(401).json({ error: "Unauthorized" });

        try {
            const parsed = createCategorySchema.safeParse(req.body);
            if (!parsed.success) {
                return res.status(422).json({
                    errors: parsed.error.issues.map((i) => i.message),
                });
            }

            const category = await container.categoryService.create(user.id, parsed.data);
            return res.json(category);
        } catch (e) {
            console.error(e);
            return res.status(500).json({ error: "Failed to create category" });
        }
    }
};
