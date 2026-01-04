import rateLimit from "express-rate-limit";

export const AuthLimiter = rateLimit({
    windowMs: 60 * 1000,                 // 1 minute
    limit: 10,                           // max 10 requests per minute
    message: {
        success: false,
        message: "Too many attempts",
        data: null,
        errors: { general: ["Too many attempts, please try again later."] },
    },
    standardHeaders: true,
    legacyHeaders: false,
});

export const ForgotPasswordLimiter = rateLimit({
    windowMs: 5 * 60 * 1000,             // 5 minutes
    limit: 3,                            // max 3 requests per 5 minutes
    message: {
        success: false,
        message: "Too many password reset requests",
        data: null,
        errors: { general: ["Too many requests. Please wait 5 minutes before trying again."] },
    },
    standardHeaders: true,
    legacyHeaders: false,
});
