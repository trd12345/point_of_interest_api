import { Router } from "express";
import RegisterController from "./controllers/auth/RegisterController";
import LoginController from "./controllers/auth/LoginController";
import { MeController } from "./controllers/auth/MeController";
import { AuthMiddleware } from "./middleware/authMiddleware";
import { AuthLimiter } from "./middleware/rateLimiter";
import VerifyEmailController from "./controllers/auth/VerifyEmailController";
import RefreshTokenController from "./controllers/auth/RefreshTokenController";
import LogoutController from "./controllers/auth/LogoutController";
import { ForgotPasswordController } from "./controllers/auth/ForgotPasswordController";
import ResetPasswordController from "./controllers/auth/ResetPasswordController";
import { CategoryController } from "./controllers/CategoryController";
import { PlacemarkController } from "./controllers/PlacemarkController";
import { ChangePasswordController } from "./controllers/auth/ChangePasswordController";

const router = Router();

router.post("/auth/login", AuthLimiter, LoginController);
router.post("/auth/logout", AuthMiddleware, LogoutController);
router.post("/auth/register", AuthLimiter, RegisterController);

// User Profile Routes
router.get("/auth/me", AuthMiddleware, MeController.get);
router.put("/auth/me", AuthMiddleware, MeController.update);
router.delete("/auth/me", AuthMiddleware, MeController.delete);
router.get("/auth/verify-email", VerifyEmailController);
router.post("/auth/refresh", AuthMiddleware, RefreshTokenController);
router.post("/auth/forgot-password", AuthLimiter, ForgotPasswordController);
router.post("/auth/reset-password", AuthLimiter, ResetPasswordController);
router.post("/auth/change-password", AuthMiddleware, ChangePasswordController);

// Category Routes - Manage classification of spots
router.get("/categories", CategoryController.getAll);
router.post("/categories", AuthMiddleware, CategoryController.create);

// Placemark Routes - Manage camping spots
router.get("/placemarks", PlacemarkController.getAll);
router.post("/placemarks", AuthMiddleware, PlacemarkController.create);
router.get("/placemarks/:id", PlacemarkController.getOne);
// Protected: Only owner can update/delete
router.put("/placemarks/:id", AuthMiddleware, PlacemarkController.update);
router.delete("/placemarks/:id", AuthMiddleware, PlacemarkController.delete);

export default router; 
