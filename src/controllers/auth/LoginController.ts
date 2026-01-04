import { Request, Response } from "express";
import { container } from "../../lib/container";

export default async function LoginController(req: Request, res: Response) {
    try {
        const result = await container.loginService.login(req.body);
        const isProduction = process.env.APP_ENV === "production";

        res.cookie("refresh_token", result.refresh_token, {
            httpOnly: true,
            secure: isProduction,
            sameSite: isProduction ? "strict" : "lax",
            path: "/auth",
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        return res.json({
            success: true,
            message: "Logged in",
            data: {
                user: result.user,
                access_token: result.access_token,
            },
            errors: null,
        });

    } catch (error: any) {
        if (error instanceof Error && error.message === "INVALID_CREDENTIALS") {
            return res.status(400).json({
                success: false,
                message: "Failed to login",
                data: null,
                errors: { general: ["Invalid credentials"] },
            });
        }

        if (error instanceof Error && error.message === "EMAIL_NOT_VERIFIED") {
            return res.status(400).json({
                success: false,
                message: "Failed to login",
                data: null,
                errors: { general: ["Email is not verified"] },
            });
        }

        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
            data: null,
            errors: { general: ["Internal Server Error"] },
        });
    }
}
