import { Router } from "express";
import RegisterController from "./controllers/auth/RegisterController";
import LoginController from "./controllers/auth/LoginController";
import { MeController } from "./controllers/auth/MeController";
import { AuthMiddleware, OptionalAuthMiddleware, AdminMiddleware } from "./middleware/authMiddleware";
import { AuthLimiter, ForgotPasswordLimiter } from "./middleware/rateLimiter";
import VerifyEmailController from "./controllers/auth/VerifyEmailController";
import RefreshTokenController from "./controllers/auth/RefreshTokenController";
import LogoutController from "./controllers/auth/LogoutController";
import { ForgotPasswordController } from "./controllers/auth/ForgotPasswordController";
import ResetPasswordController from "./controllers/auth/ResetPasswordController";
import { CategoryController } from "./controllers/CategoryController";
import { PlacemarkController } from "./controllers/PlacemarkController";
import { ChangePasswordController } from "./controllers/auth/ChangePasswordController";
import { AdminController } from "./controllers/AdminController";
import { ReviewController } from "./controllers/ReviewController";
import multer from "multer";

const upload = multer();

const router = Router();

router.post("/auth/login", AuthLimiter, LoginController);
router.post("/auth/logout", AuthMiddleware, LogoutController);
router.post("/auth/register", AuthLimiter, RegisterController);

// User Profile Routes
router.get("/auth/me", AuthMiddleware, MeController.get);
router.put("/auth/me", AuthMiddleware, MeController.update);
router.delete("/auth/me", AuthMiddleware, MeController.delete);
router.get("/auth/verify-email", VerifyEmailController);
router.post("/auth/verify-email-change", MeController.verifyEmailChange);
router.post("/auth/refresh", AuthMiddleware, RefreshTokenController);
router.post("/auth/forgot-password", ForgotPasswordLimiter, ForgotPasswordController);
router.post("/auth/reset-password", AuthLimiter, ResetPasswordController);
router.post("/auth/change-password", AuthMiddleware, ChangePasswordController);

// Admin Routes
router.get("/admin/users", AuthMiddleware, AdminMiddleware, AdminController.getAllUsers);
router.delete("/admin/users/:id", AuthMiddleware, AdminMiddleware, AdminController.deleteUser);
router.patch("/admin/users/:id/role", AuthMiddleware, AdminMiddleware, AdminController.updateUserRole);

// Category Routes - Manage classification of spots
router.get("/categories", CategoryController.getAll);
router.post("/categories", AuthMiddleware, AdminMiddleware, CategoryController.create);
router.delete("/categories/:id", AuthMiddleware, AdminMiddleware, CategoryController.delete);

// Placemark Routes - Manage camping spots
router.get("/placemarks", PlacemarkController.getAll);
router.post("/placemarks", AuthMiddleware, upload.single("image"), PlacemarkController.create);
router.get("/placemarks/:id", OptionalAuthMiddleware, PlacemarkController.getOne);
// Protected: Only owner can update/delete
router.put("/placemarks/:id", AuthMiddleware, upload.single("image"), PlacemarkController.update);
router.delete("/placemarks/:id", AuthMiddleware, PlacemarkController.delete);

// Review Routes
router.get("/placemarks/:placemarkId/reviews", ReviewController.getByPlacemark);
router.post("/reviews", AuthMiddleware, ReviewController.create);
router.delete("/reviews/:id", AuthMiddleware, ReviewController.delete);

export default router;
