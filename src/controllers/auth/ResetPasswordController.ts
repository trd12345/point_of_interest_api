import { Request, Response } from "express";
import { z } from "zod";
import { container } from "../../lib/container";

const resetPasswordSchema = z.object({
    token: z.string(),
    password: z
        .string()
        .min(8, "Password must be at least 8 characters long")
        .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
        .regex(/[a-z]/, "Password must contain at least one lowercase letter")
        .regex(/[0-9]/, "Password must contain at least one number")
        .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character"),
});

export default async function ResetPasswordController(req: Request, res: Response) {
    try {
        const parsed = resetPasswordSchema.safeParse(req.body);

        if (!parsed.success) {
            return res.status(422).json({
                success: false,
                message: "Validation failed",
                data: null,
                errors: parsed.error.issues.map((i) => i.message),
            });
        }

        await container.resetPasswordService.resetPassword({
            token: parsed.data.token,
            password: parsed.data.password
        });

        return res.json({
            success: true,
            message: "Password has been reset successfully.",
            data: null,
            errors: null,
        });
    } catch (error: any) {
        if (error.message === "INVALID_OR_EXPIRED_TOKEN") {
            return res.status(400).json({
                success: false,
                message: "Invalid or expired token.",
                data: null,
                errors: ["Invalid or expired token."],
            });
        }

        return res.status(500).json({
            success: false,
            message: "An error occurred while processing your request.",
            data: null,
            errors: ["An error occurred while processing your request."],
        });
    }
} 
