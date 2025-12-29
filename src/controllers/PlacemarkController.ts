import { Request, Response } from "express";
import { container } from "../lib/container";
import { z } from "zod";

const placemarkSchema = z.object({
    name: z.string().min(1),
    description: z.string().optional(),
    categoryId: z.string().min(1),
    address: z.string().min(1),
    lat: z.number(),
    lng: z.number(),
    is_public: z.boolean().optional()
});

export const PlacemarkController = {
    // Get all placemarks
    getAll: async (req: Request, res: Response) => {
        const placemarks = await container.placemarkService.getAll();
        return res.json(placemarks);
    },

    // Get a single placemark by ID
    getOne: async (req: Request, res: Response) => {
        try {
            const placemark = await container.placemarkService.getById(req.params.id);
            return res.json(placemark);
        } catch (e) {
            return res.status(404).json({ error: "Placemark not found" });
        }
    },

    // Create a new placemark
    create: async (req: Request, res: Response) => {
        const user = (req as any).user;
        if (!user) return res.status(401).json({ error: "Unauthorized" });

        const parsed = placemarkSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(422).json({
                errors: parsed.error.issues.map((i) => i.message),
            });
        }

        try {
            const placemark = await container.placemarkService.create(user.id, parsed.data);
            return res.json(placemark);
        } catch (e) {
            return res.status(500).json({ error: "Failed to create placemark" });
        }
    },

    // Update an existing placemark
    update: async (req: Request, res: Response) => {
        const user = (req as any).user;
        if (!user) return res.status(401).json({ error: "Unauthorized" });

        const parsed = placemarkSchema.partial().safeParse(req.body);
        if (!parsed.success) {
            return res.status(422).json({
                errors: parsed.error.issues.map((i) => i.message),
            });
        }

        try {
            const placemark = await container.placemarkService.update(user.id, req.params.id, parsed.data);
            return res.json(placemark);
        } catch (e: any) {
            if (e.message === "FORBIDDEN") return res.status(403).json({ error: "Forbidden" });
            if (e.message === "NOT_FOUND") return res.status(404).json({ error: "Not found" });
            return res.status(500).json({ error: "Values incorrect or something went wrong" });
        }
    },

    // Delete a placemark
    delete: async (req: Request, res: Response) => {
        const user = (req as any).user;
        if (!user) return res.status(401).json({ error: "Unauthorized" });

        try {
            await container.placemarkService.delete(user.id, req.params.id);
            return res.json({ message: "Deleted" });
        } catch (e: any) {
            if (e.message === "FORBIDDEN") return res.status(403).json({ error: "Forbidden" });
            if (e.message === "NOT_FOUND") return res.status(404).json({ error: "Not found" });
            return res.status(500).json({ error: "Something went wrong" });
        }
    }
};
