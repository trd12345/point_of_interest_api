import {Request, Response} from "express";
import {container} from "../../lib/container";

export default async function VerifyEmailController(req: Request, res: Response) {
    try {
        const {token} = req.query;

        if (!token) {
            return res.status(422).json({
                success: false,
                message: "Verification token missing",
                data: null,
                errors: ["Verification token missing"],
            });
        }

        await container.emailVerificationService.verifyEmail(token as string);

        return res.json({
            success: true,
            message: "Email successfully verified.",
            data: null,
            errors: null,
        });

    } catch (e: any) {
        const msg = e.message;

        if (msg === "INVALID_OR_EXPIRED_TOKEN")
            return res.status(400).json({
                success: false,
                message: "Invalid or expired token",
                data: null,
                errors: ["Invalid or expired token"],
            });

        if (msg === "ALREADY_VERIFIED")
            return res.status(400).json({
                success: false,
                message: "Email already verified",
                data: null,
                errors: ["Email already verified"],
            });

        if (msg === "USER_NOT_FOUND")
            return res.status(404).json({
                success: false,
                message: "User not found",
                data: null,
                errors: ["User not found"],
            });
        
        return res.status(500).json({
            success: false,
            message: "Something went wrong",
            data: null,
            errors: ["Something went wrong"],
        });
    }
}
