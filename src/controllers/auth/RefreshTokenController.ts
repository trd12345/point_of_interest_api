import {Request, Response} from "express";
import {container} from "../../lib/container";

export default async function RefreshTokenController(req: Request, res: Response) {
    try {
        const refreshToken = req.cookies?.refresh_token;

        if (!refreshToken) {
            return res.status(401).json({
                success: false,
                message: "No refresh token",
                data: null,
                errors: ["No refresh token"],
            });
        }

        const tokens = await container.refreshTokenService.refresh(refreshToken);

        const isProduction = process.env.APP_ENV === "production";

        res.cookie("refresh_token", tokens.refresh_token, {
            httpOnly: true,
            secure: isProduction,
            sameSite: isProduction ? "strict" : "lax",
            path: "/auth",
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        return res.json({
            success: true,
            message: "Token refreshed",
            data: {
                access_token: tokens.access_token,
            },
            errors: null,
        });

    } catch (e: any) {
        if (e.message === "INVALID_OR_EXPIRED_REFRESH_TOKEN") {
            return res.status(401).json({
                success: false,
                message: "Invalid or expired refresh token",
                data: null,
                errors: ["Invalid or expired refresh token"],
            });
        }

        return res.status(500).json({
            success: false,
            message: "Something went wrong",
            data: null,
            errors: ["Something went wrong"],
        });
    }
}
