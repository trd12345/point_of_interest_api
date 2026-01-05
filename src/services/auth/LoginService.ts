import { PrismaClient } from "../../generated/prisma/client";
import bcrypt from "bcrypt";
import { generateAccessToken, generateRefreshToken } from "../../lib/jwt";
import jwt from "jsonwebtoken";

const prisma = new PrismaClient();

export class LoginService {
    constructor(private db: PrismaClient) {
    }

    async login(data: {
        email: string;
        password: string;
    }) {
        const user = await this.db.user.findFirst({
            where: { email: data.email },
            include: {
                profile: true,
                oauthAccount: true
            },
        });

        if (!user) {
            throw new Error("INVALID_CREDENTIALS");
        }

        if (!user.email_verified_at) {
            throw new Error("EMAIL_NOT_VERIFIED");
        }

        if (!user.password) {
            throw new Error("INVALID_CREDENTIALS");
        }

        const valid = await bcrypt.compare(data.password, user.password);

        if (!valid) {
            throw new Error("INVALID_CREDENTIALS");
        }

        delete (user as any).password;
        // if user is admin, set tokenOptions to 30m
        const tokenOptions = user.role === "ADMIN" ? { expiresIn: "30m" } : {};

        // Cast to any to bypass strict literal type check temporarily, or define SignOptions properly
        const access_token = generateAccessToken({
            id: user.id,
            email: user.email,
            role: user.role
        }, tokenOptions as any);

        const refresh_token = generateRefreshToken({
            id: user.id,
        });

        const { jti } = jwt.decode(access_token) as any;

        await this.db.refreshToken.create({
            data: {
                userId: user.id,
                jti,
                token: refresh_token,
                expiresAt: new Date(Date.now() + 7 * 24 * 3600 * 1000)
            }
        });

        return {
            user: {
                ...user,
                oauth_provider: user.oauthAccount?.provider || null,
                oauth_id: user.oauthAccount?.providerId || null
            },
            access_token,
            refresh_token,
        };
    }
}


