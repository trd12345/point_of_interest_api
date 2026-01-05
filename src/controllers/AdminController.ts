import { Request, Response } from "express";
import { container } from "../lib/container";

export const AdminController = {
    getAllUsers: async (req: Request, res: Response) => {
        const user = (req as any).user;
        if (user.role !== "ADMIN") {
            return res.status(403).json({
                success: false,
                message: "Forbidden",
                data: null,
                errors: ["Admin access required"],
            });
        }

        try {
            const users = await container.adminService.getAllUsers();
            return res.json({
                success: true,
                message: "Users retrieved successfully",
                data: { users },
                errors: null,
            });
        } catch (e: any) {
            return res.status(500).json({
                success: false,
                message: "Failed to fetch users",
                data: null,
                errors: ["Something went wrong"],
            });
        }
    },

    deleteUser: async (req: Request, res: Response) => {
        const user = (req as any).user;
        if (user.role !== "ADMIN") {
            return res.status(403).json({
                success: false,
                message: "Forbidden",
                data: null,
                errors: ["Admin access required"],
            });
        }

        try {
            const targetUserId = req.params.id;

            // Prevent admin from deleting themselves via this endpoint (should use /me or similar if allowed)
            if (targetUserId === user.id) {
                return res.status(400).json({
                    success: false,
                    message: "Bad Request",
                    data: null,
                    errors: ["You cannot delete your own admin account through the user management dashboard."],
                });
            }

            await container.adminService.deleteUser(targetUserId);
            return res.json({
                success: true,
                message: "User deleted successfully",
                data: null,
                errors: null,
            });
        } catch (e) {
            return res.status(500).json({
                success: false,
                message: "Failed to delete user",
                data: null,
                errors: ["Something went wrong"],
            });
        }
    },

    updateUserRole: async (req: Request, res: Response) => {
        const user = (req as any).user;
        if (user.role !== "ADMIN") {
            return res.status(403).json({
                success: false,
                message: "Forbidden",
                data: null,
                errors: ["Admin access required"],
            });
        }

        try {
            const targetUserId = req.params.id;
            const { role } = req.body;

            if (!["USER", "ADMIN"].includes(role)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid role",
                    data: null,
                    errors: ["Role must be either USER or ADMIN"],
                });
            }

            // Prevent admin from changing their own role to USER (so we always have at least one admin)
            if (targetUserId === user.id && role !== "ADMIN") {
                return res.status(400).json({
                    success: false,
                    message: "Bad Request",
                    data: null,
                    errors: ["You cannot demote yourself."],
                });
            }

            const updatedUser = await container.adminService.updateUserRole(targetUserId, role);
            return res.json({
                success: true,
                message: "User role updated successfully",
                data: { user: updatedUser },
                errors: null,
            });
        } catch (e) {
            return res.status(500).json({
                success: false,
                message: "Failed to update user role",
                data: null,
                errors: ["Something went wrong"],
            });
        }
    }
};
