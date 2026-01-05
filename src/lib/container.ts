import { RegisterService } from "../services/auth/RegisterService";
import { MeService } from "../services/auth/MeService";
import { LoginService } from "../services/auth/LoginService";
import { EmailVerificationService } from "../services/auth/EmailVerificationService";
import { RefreshTokenService } from "../services/auth/RefreshTokenService";
import { LogoutService } from "../services/auth/LogoutService";
import { ForgotPasswordService } from "../services/auth/ForgotPasswordService";
import { ResetPasswordService } from "../services/auth/ResetPasswordService";
import { CategoryService } from "../services/CategoryService";
import { PlacemarkService } from "../services/PlacemarkService";
import { ChangePasswordService } from "../services/auth/ChangePasswordService";
import { GeocodingService } from "../services/GeocodingService";
import { ImageService } from "../services/ImageService";
import { AdminService } from "../services/AdminService";
import { ReviewService } from "../services/ReviewService";
import { PrismaClient } from "../generated/prisma/client";


class Container {
    prisma = new PrismaClient();

    loginService = new LoginService(this.prisma);
    registerService = new RegisterService(this.prisma);
    emailVerificationService = new EmailVerificationService(this.prisma);
    meService = new MeService(this.prisma);
    refreshTokenService = new RefreshTokenService(this.prisma);
    logoutService = new LogoutService(this.prisma);
    forgotPasswordService = new ForgotPasswordService(this.prisma);
    resetPasswordService = new ResetPasswordService(this.prisma);
    categoryService = new CategoryService(this.prisma);
    placemarkService = new PlacemarkService(this.prisma);
    changePasswordService = new ChangePasswordService(this.prisma);
    adminService = new AdminService(this.prisma);
    geocodingService = new GeocodingService();
    imageService = new ImageService();
    reviewService = new ReviewService(this.prisma);
}

export const container = new Container();
