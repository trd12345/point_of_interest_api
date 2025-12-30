import { Request, Response } from "express";
import { container } from "../lib/container";
import { z } from "zod";

const placemarkSchema = z.object({
    name: z.string().min(1),
    description: z.string().optional(),
    categoryId: z.string().min(1),
    street: z.string().min(1),
    house_number: z.string().min(1),
    zip: z.string().min(1),
    city: z.string().min(1),
    country: z.string().min(1),
    lat: z.number().optional(),
    lng: z.number().optional(),
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

        const data = parsed.data;

        // Geocoding Logic: If lat/lng missing, fetch them
        if (data.lat === undefined || data.lng === undefined) {
            // Construct address string for search: "Street HouseNo, Zip City, Country"
            const searchAddress = `${data.street} ${data.house_number}, ${data.zip} ${data.city}, ${data.country}`;

            const coords = await container.geocodingService.getCoordinates(searchAddress);
            if (coords) {
                data.lat = coords.lat;
                data.lng = coords.lng;
            } else {
                return res.status(422).json({
                    error: "Could not find location for the given address. Please check the address or provide coordinates manually."
                });
            }
        }

        try {
            // We cast data to 'any' or check properties because safeParse returns optional types, 
            // but PlacemarkService expects mandatory lat/lng. We ensured they exist above.
            const placemark = await container.placemarkService.create(user.id, data as any);
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
