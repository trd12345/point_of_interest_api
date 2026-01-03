import { Request, Response } from "express";
import { container } from "../../lib/container";
import { z } from "zod";

const changePasswordSchema = z.object({
    old_password: z.string().min(1),
    new_password: z.string().min(8)
});

/**
 * Controller to handle change password requests.
 */
export const ChangePasswordController = async (req: Request, res: Response) => {
    const user = (req as any).user;
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    const parsed = changePasswordSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(422).json({
            errors: parsed.error.issues.map((i) => i.message),
        });
    }

    try {
        await container.changePasswordService.changePassword(user.id, parsed.data);
        return res.json({ message: "Password changed successfully. Please log in again." });
    } catch (e: any) {
        if (e.message === "INVALID_PASSWORD") {
            return res.status(400).json({ errors: ["Current password is incorrect"] });
        }
        return res.status(500).json({ error: "Something went wrong" });
    }
}; 
