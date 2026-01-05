import { Request, Response } from "express";
import { container } from "../../lib/container";
import { z } from "zod";

interface AuthRequest extends Request {
    user?: { id: string; email: string };
}

const updateProfileSchema = z.object({
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    email: z.string().email(),
    contactEmail: z.string().email().optional().or(z.literal("")),
    contactPhone: z.string().optional().or(z.literal("")),
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
                errors: parsed.error.format(),
            });
        }

        try {
            const userId = req.user!.id;

            // Perform updates
            const { user, emailChangeRequested } = await container.meService.updateProfile(userId, parsed.data);

            return res.json({
                success: true,
                message: emailChangeRequested
                    ? "Profile updated and verification email sent to the new address."
                    : "Profile updated",
                data: {
                    user,
                    emailChangeRequested
                },
                errors: null,
            });
        } catch (e: any) {
            if (e.message === "EMAIL_TAKEN") {
                return res.status(400).json({
                    success: false,
                    message: "Email is already taken",
                    data: null,
                    errors: { email: ["Email is already taken"] },
                });
            }
            return res.status(500).json({
                success: false,
                message: "Failed to update profile",
                data: null,
                errors: { general: ["Failed to update profile"] },
            });
        }
    },

    // Verify Email Change
    verifyEmailChange: async (req: Request, res: Response) => {
        const { token } = req.body;

        if (!token) {
            return res.status(422).json({
                success: false,
                message: "Token is required",
                data: null,
                errors: { token: ["Token is required"] },
            });
        }

        try {
            const user = await container.meService.verifyEmailChange(token);
            return res.json({
                success: true,
                message: "Email updated successfully.",
                data: { user },
                errors: null,
            });
        } catch (e: any) {
            if (e.message === "INVALID_OR_EXPIRED_TOKEN") {
                return res.status(400).json({
                    success: false,
                    message: "Invalid or expired token",
                    data: null,
                    errors: { token: ["Invalid or expired token"] },
                });
            }
            if (e.message === "EMAIL_TAKEN") {
                return res.status(400).json({
                    success: false,
                    message: "Email is already taken",
                    data: null,
                    errors: { email: ["Email is already taken"] },
                });
            }
            return res.status(500).json({
                success: false,
                message: "Something went wrong",
                data: null,
                errors: { general: ["Something went wrong"] },
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