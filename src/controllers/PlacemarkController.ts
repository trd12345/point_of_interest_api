import { Request, Response } from "express";
import { container } from "../lib/container";
import { z } from "zod";

const placemarkSchema = z.object({
    name: z.string().min(1),
    description: z.string().optional(),
    categoryId: z.string().min(1),
    street: z.string().min(1),
    house_number: z.string().optional(), // house number is optional
    zip: z.coerce.number(), // Automatically convert string input to number
    city: z.string().min(1),
    country: z.string().min(1),
    lat: z.number().optional(),
    lng: z.number().optional(),
    is_public: z.preprocess((val) => val === "true" || val === true, z.boolean()).optional()
});

export const PlacemarkController = {
    // Get all placemarks
    getAll: async (req: Request, res: Response) => {
        try {
            const placemarks = await container.placemarkService.getAll();
            return res.json({
                success: true,
                message: "Placemarks retrieved successfully",
                data: {
                    placemarks,
                },
                errors: null,
            });
        } catch (e) {
            return res.status(500).json({
                success: false,
                message: "Failed to fetch placemarks",
                data: null,
                errors: ["Something went wrong"],
            });
        }
    },

    // Get a single placemark by ID
    getOne: async (req: Request, res: Response) => {
        const user = (req as any).user;
        try {
            const placemark = await container.placemarkService.getById(req.params.id, user?.id, user?.role === "ADMIN");
            if (!placemark) {
                return res.status(404).json({
                    success: false,
                    message: "Placemark not found",
                    data: null,
                    errors: ["Placemark not found"],
                });
            }
            return res.json({
                success: true,
                message: "Placemark found",
                data: {
                    placemark,
                },
                errors: null,
            });
        } catch (e) {
            return res.status(404).json({
                success: false,
                message: "Placemark not found",
                data: null,
                errors: ["Placemark not found"],
            });
        }
    },

    // Create a new placemark
    create: async (req: Request, res: Response) => {
        const user = (req as any).user;
        const parsed = placemarkSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(422).json({
                success: false,
                message: "Validation failed",
                data: null,
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
                    success: false,
                    message: "Geocoding failed",
                    data: null,
                    errors: ["Could not find location for the given address. Please check the address or provide coordinates manually."],
                });
            }
        }

        // Image Upload Logic
        let imageUrl: string | undefined;
        if (req.file) {
            try {
                imageUrl = await container.imageService.uploadImage(req.file.buffer);
            } catch (error) {
                return res.status(500).json({
                    success: false,
                    message: "Image upload failed",
                    data: null,
                    errors: ["Image upload failed"],
                });
            }
        }

        try {
            // Ensure lat/lng are present (logic above guarantees this or returns 422)
            // We use '!' assertions because we know they are defined now (or we returned)
            const placemarkData = {
                ...data,
                lat: data.lat!,
                lng: data.lng!,
                image_url: imageUrl
            };

            const placemark = await container.placemarkService.create(user.id, placemarkData);
            return res.status(201).json({
                success: true,
                message: "Placemark created successfully",
                data: {
                    placemark,
                },
                errors: null,
            });
        } catch (e) {
            return res.status(500).json({
                success: false,
                message: "Failed to create placemark",
                data: null,
                errors: ["Failed to create placemark"],
            });
        }
    },

    // Update an existing placemark
    update: async (req: Request, res: Response) => {
        const user = (req as any).user;

        const parsed = placemarkSchema.partial().safeParse(req.body);
        if (!parsed.success) {
            return res.status(422).json({
                success: false,
                message: "Validation failed",
                data: null,
                errors: parsed.error.issues.map((i) => i.message),
            });
        }

        // Image Upload Logic
        let imageUrl: string | undefined;
        if (req.file) {
            try {
                imageUrl = await container.imageService.uploadImage(req.file.buffer);
            } catch (error) {
                return res.status(500).json({
                    success: false,
                    message: "Image upload failed",
                    data: null,
                    errors: ["Image upload failed"],
                });
            }
        }

        try {
            const updateData: any = {
                ...parsed.data,
            };

            if (imageUrl) {
                updateData.image_url = imageUrl;
            } else if (req.body.removeImage === "true") {
                updateData.image_url = null;
            }

            const placemark = await container.placemarkService.update(user.id, req.params.id, updateData);
            return res.json({
                success: true,
                message: "Placemark updated successfully",
                data: {
                    placemark,
                },
                errors: null,
            });
        } catch (e: any) {
            if (e.message === "FORBIDDEN") return res.status(403).json({
                success: false,
                message: "Forbidden",
                data: null,
                errors: ["Forbidden"],
            });
            if (e.message === "NOT_FOUND") return res.status(404).json({
                success: false,
                message: "Not found",
                data: null,
                errors: ["Not found"],
            });
            return res.status(500).json({
                success: false,
                message: "Values incorrect or something went wrong",
                data: null,
                errors: ["Values incorrect or something went wrong"],
            });
        }
    },

    // Delete a placemark
    delete: async (req: Request, res: Response) => {
        const user = (req as any).user;

        try {
            await container.placemarkService.delete(user.id, req.params.id, user.role === "ADMIN");
            return res.json({
                success: true,
                message: "Placemark deleted successfully",
                data: null,
                errors: null,
            });
        } catch (e: any) {
            if (e.message === "FORBIDDEN") return res.status(403).json({
                success: false,
                message: "Forbidden",
                data: null,
                errors: ["Forbidden"],
            });
            if (e.message === "NOT_FOUND") return res.status(404).json({
                success: false,
                message: "Not found",
                data: null,
                errors: ["Not found"],
            });
            return res.status(500).json({
                success: false,
                message: "Something went wrong",
                data: null,
                errors: ["Something went wrong"],
            });
        }
    }
}; 
