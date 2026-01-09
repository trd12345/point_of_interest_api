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
import { GoogleOAuthController } from "./controllers/GoogleOAuthController";
import multer from "multer";

const upload = multer();

const router = Router();

/**
 * @openapi
 * /auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Login a user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 */
router.post("/auth/login", AuthLimiter, LoginController);

/**
 * @openapi
 * /auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: Register a new user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               first_name:
 *                 type: string
 *               last_name:
 *                 type: string
 *     responses:
 *       201:
 *         description: User registered successfully
 */
router.post("/auth/register", AuthLimiter, RegisterController);
router.post("/auth/google", AuthLimiter, GoogleOAuthController.googleAuth);

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
/**
 * @openapi
 * /admin/users:
 *   get:
 *     tags: [Admin]
 *     summary: Get all users (Admin only)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of users
 */
router.get("/admin/users", AuthMiddleware, AdminMiddleware, AdminController.getAllUsers);
/**
 * @openapi
 * /admin/users/{id}:
 *   delete:
 *     tags: [Admin]
 *     summary: Delete a user (Admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: User deleted
 */
router.delete("/admin/users/:id", AuthMiddleware, AdminMiddleware, AdminController.deleteUser);
/**
 * @openapi
 * /admin/users/{id}/role:
 *   patch:
 *     tags: [Admin]
 *     summary: Update user role (Admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               role:
 *                 type: string
 *                 enum: [USER, ADMIN]
 *     responses:
 *       200:
 *         description: Role updated
 */
router.patch("/admin/users/:id/role", AuthMiddleware, AdminMiddleware, AdminController.updateUserRole);

// Category Routes - Manage classification of spots
/**
 * @openapi
 * /categories:
 *   get:
 *     tags: [Categories]
 *     summary: Get all categories
 *     responses:
 *       200:
 *         description: List of categories
 */
router.get("/categories", CategoryController.getAll);
/**
 * @openapi
 * /categories:
 *   post:
 *     tags: [Categories]
 *     summary: Create a category (Admin only)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Category'
 *     responses:
 *       201:
 *         description: Category created
 */
router.post("/categories", AuthMiddleware, AdminMiddleware, CategoryController.create);
/**
 * @openapi
 * /categories/{id}:
 *   delete:
 *     tags: [Categories]
 *     summary: Delete a category (Admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Category deleted
 */
router.delete("/categories/:id", AuthMiddleware, AdminMiddleware, CategoryController.delete);

// Placemark Routes - Manage camping spots
/**
 * @openapi
 * /placemarks:
 *   get:
 *     tags: [Placemarks]
 *     summary: Get all placemarks
 *     responses:
 *       200:
 *         description: List of placemarks
 */
router.get("/placemarks", PlacemarkController.getAll);

/**
 * @openapi
 * /placemarks:
 *   post:
 *     tags: [Placemarks]
 *     summary: Create a new placemark
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               street:
 *                 type: string
 *               house_number:
 *                 type: string
 *               zip:
 *                 type: integer
 *               city:
 *                 type: string
 *               country:
 *                 type: string
 *               image:
 *                 type: string
 *                 format: binary
 *               categoryId:
 *                 type: string
 *     responses:
 *       201:
 *         description: Placemark created successfully
 */
router.post("/placemarks", AuthMiddleware, upload.single("image"), PlacemarkController.create);
/**
 * @openapi
 * /placemarks/{id}:
 *   get:
 *     tags: [Placemarks]
 *     summary: Get a single placemark by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Placemark'
 */
router.get("/placemarks/:id", OptionalAuthMiddleware, PlacemarkController.getOne);

// Protected: Only owner can update/delete
/**
 * @openapi
 * /placemarks/{id}:
 *   put:
 *     tags: [Placemarks]
 *     summary: Update a placemark
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             $ref: '#/components/schemas/Placemark'
 *     responses:
 *       200:
 *         description: Placemark updated
 */
router.put("/placemarks/:id", AuthMiddleware, upload.single("image"), PlacemarkController.update);

/**
 * @openapi
 * /placemarks/{id}:
 *   delete:
 *     tags: [Placemarks]
 *     summary: Delete a placemark
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Placemark deleted
 */
router.delete("/placemarks/:id", AuthMiddleware, PlacemarkController.delete);

// Review Routes
/**
 * @openapi
 * /placemarks/{placemarkId}/reviews:
 *   get:
 *     tags: [Reviews]
 *     summary: Get reviews for a placemark
 *     parameters:
 *       - in: path
 *         name: placemarkId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of reviews
 */
router.get("/placemarks/:placemarkId/reviews", ReviewController.getByPlacemark);
/**
 * @openapi
 * /reviews:
 *   post:
 *     tags: [Reviews]
 *     summary: Create a review
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Review'
 *     responses:
 *       201:
 *         description: Review created
 */
router.post("/reviews", AuthMiddleware, ReviewController.create);
/**
 * @openapi
 * /reviews/{id}:
 *   delete:
 *     tags: [Reviews]
 *     summary: Delete a review
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Review deleted
 */
router.delete("/reviews/:id", AuthMiddleware, ReviewController.delete);

export default router;
