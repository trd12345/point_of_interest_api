import { z } from "zod";
import { container } from "../../lib/container";
import { Request, Response } from "express";

// 1. Validation for email
const forgotPasswordSchema = z.object({
    email: z.email(),
});

export async function ForgotPasswordController(req: Request, res: Response) {
    try {
        // 2. Run validation
        const parsed = forgotPasswordSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(422).json({
                success: false,
                message: "Validation failed",
                data: null,
                errors: parsed.error.issues.map((i) => i.message),
            });
        }
        // 3. Call forgot password service
        await container.forgotPasswordService.forgotPassword(req.body)
        // 4. Return response
        return res.json({
            success: true,
            message: "Check your email for reset link.",
            data: null,
            errors: null,
        });
    } catch (error: any) {
        // 5. Handle errors
        const msg = error.message;
        if (msg === "USER_NOT_FOUND") {
            return res.status(404).json({
                success: false,
                message: "User not found",
                data: null,
                errors: ["User not found"],
            });
        }
        // When error is not expected
        console.log(error);
        return res.status(500).json({
            success: false,
            message: "Something went wrong",
            data: null,
            errors: ["Something went wrong"],
        });
    }
}