import { Request, Response } from "express";
import { container } from "../../lib/container";
import { z } from "zod";

interface AuthRequest extends Request {
    user?: { id: string; email: string };
}

const updateProfileSchema = z.object({
    firstName: z.string().min(1).optional(),
    lastName: z.string().min(1).optional(),
});

export const MeController = {
    // Get Current User
    get: async (req: AuthRequest, res: Response) => {
        try {
            const user = await container.meService.getMe(req.user!.id);
            return res.json({
                success: true,
                message: "User found",
                data: {
                    user: user,
                },
                errors: null,
            });
        } catch (error: unknown) {
            if (error instanceof Error && error.message === "USER_NOT_FOUND") {
                return res.status(404).json({
                    success: false,
                    message: "User not found",
                    data: null,
                    errors: ["User not found"],
                });
            }
            return res.status(500).json({
                success: false,
                message: "Something went wrong",
                data: null,
                errors: ["Something went wrong"],
            });
        }
    },

    // Update Current User Profile
    update: async (req: AuthRequest, res: Response) => {
        const parsed = updateProfileSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(422).json({
                success: false,
                message: "Validation failed",
                data: null,
                errors: parsed.error.issues.map((i) => i.message),
            });
        }

        try {
            const updatedUser = await container.meService.updateProfile(req.user!.id, parsed.data);
            return res.json({
                success: true,
                message: "Profile updated",
                data: {
                    user: updatedUser,
                },
                errors: null,
            });
        } catch (e) {
            return res.status(500).json({
                success: false,
                message: "Failed to update profile",
                data: null,
                errors: ["Failed to update profile"],
            });
        }
    },

    // Delete Current User Account
    delete: async (req: AuthRequest, res: Response) => {
        try {
            await container.meService.deleteAccount(req.user!.id);
            return res.json({
                success: true,
                message: "Account deleted successfully",
                data: null,
                errors: null,
            });
        } catch (e) {
            return res.status(500).json({
                success: false,
                message: "Failed to delete account",
                data: null,
                errors: ["Failed to delete account"],
            });
        }
    }
}; 