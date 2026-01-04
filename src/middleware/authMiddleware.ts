import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { PrismaClient } from "../generated/prisma/client";

interface AuthRequest extends Request {
    user?: { id: string; email: string; role: string };
}

const prisma = new PrismaClient();

export async function AuthMiddleware(
    req: AuthRequest,
    res: Response,
    next: NextFunction
) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ errors: ["Unauthorized"] });
    }

    const token = authHeader.split(" ")[1];

    try {
        // 1. Verify token
        const decoded: any = jwt.verify(
            token,
            process.env.JWT_SECRET as string
        );

        // 2. Check if THIS access token has been revoked
        if (decoded.jti) {
            const tokenRecord = await prisma.refreshToken.findFirst({
                where: {
                    jti: decoded.jti
                }
            });

            if (!tokenRecord || tokenRecord.revoked) {
                return res.status(401).json({ errors: ["Token expired or revoked"] });
            }
        }

        // 3. Ensure role is present, fetch from DB if necessary (or just always fetch for safety)
        if (!decoded.role) {
            const user = await prisma.user.findUnique({ where: { id: decoded.id } });
            if (!user) return res.status(401).json({ errors: ["User not found"] });
            decoded.role = user.role;
        }

        // 4. Put user on request and continue
        req.user = decoded;
        next();

    } catch (error) {
        return res.status(401).json({ errors: ["Invalid or expired token"] });
    }
}

export async function OptionalAuthMiddleware(
    req: AuthRequest,
    res: Response,
    next: NextFunction
) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return next();
    }

    const token = authHeader.split(" ")[1];

    try {
        const decoded: any = jwt.verify(
            token,
            process.env.JWT_SECRET as string
        );

        if (decoded.jti) {
            const tokenRecord = await prisma.refreshToken.findFirst({
                where: {
                    jti: decoded.jti
                }
            });

            if (!tokenRecord || tokenRecord.revoked) {
                return next();
            }
        }

        if (!decoded.role) {
            const user = await prisma.user.findUnique({ where: { id: decoded.id } });
            if (user) {
                decoded.role = user.role;
            } else {
                return next();
            }
        }

        req.user = decoded;
        next();

    } catch (error) {
        next();
    }
}

export async function AdminMiddleware(
    req: AuthRequest,
    res: Response,
    next: NextFunction
) {
    // 1. Check if user is authenticated (via AuthMiddleware usually)
    if (!req.user) {
        return res.status(401).json({
            success: false,
            message: "Unauthorized",
            data: null,
            errors: ["Authentication required"],
        });
    }

    // 2. Check if user is admin
    if (req.user.role !== "ADMIN") {
        return res.status(403).json({
            success: false,
            message: "Forbidden",
            data: null,
            errors: ["Admin access required"],
        });
    }

    next();
}
