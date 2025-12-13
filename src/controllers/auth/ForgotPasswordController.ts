import {z} from "zod";
import {container} from "../../lib/container";
import {Request, Response} from "express";

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
                errors: parsed.error.issues.map((i) => i.message),
            });
        }
        // 3. Call forgot password service
        const result = container.forgotPasswordService.forgotPassword(req.body)
        // 4. Return response
        return res.json({message: "Check your email for reset link."});
    } catch (error: any) {
        // 5. Handle errors
        const msg = error.message;
        if (msg === "USER_NOT_FOUND") {
            return res.status(404).json({errors: "User not found"});
        }
        return res.status(500).json({errors: "Something went wrong"});
    }
}