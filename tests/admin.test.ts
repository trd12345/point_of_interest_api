import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../app';
import { PrismaClient } from '../src/generated/prisma/client';
import jwt from 'jsonwebtoken';
import { randomUUID, randomBytes } from 'crypto';

const prisma = new PrismaClient();
const generateObjectId = () => randomBytes(12).toString('hex');

describe('Admin Dashboard API E2E Tests', () => {
    let adminToken: string;
    let userToken: string;
    let targetUserId: string;

    async function setupToken(role: string) {
        const id = generateObjectId();
        await prisma.user.create({
            data: {
                id,
                email: `${randomUUID()}@admin.test`,
                password: 'password',
                role,
                email_verified_at: new Date(),
                profile: { create: { first_name: 'Admin', last_name: 'Tester' } }
            }
        });

        const token = jwt.sign(
            { id, role, jti: randomUUID() },
            process.env.JWT_SECRET as string,
            { expiresIn: '1h' }
        );

        await prisma.refreshToken.create({
            data: {
                userId: id,
                jti: (jwt.decode(token) as any).jti,
                token: randomUUID(),
                expiresAt: new Date(Date.now() + 3600 * 1000)
            }
        });

        return token;
    }

    beforeAll(async () => {
        adminToken = await setupToken('ADMIN');
        userToken = await setupToken('USER');

        // Create a target user to manage
        const targetEmail = `target-${randomUUID()}@test.com`;
        const target = await prisma.user.create({
            data: {
                email: targetEmail,
                password: 'pw',
                profile: { create: { first_name: 'Target', last_name: 'User' } }
            }
        });
        targetUserId = target.id;
    });

    afterAll(async () => {
        // Cleanup admin and user tokens
        const ids = [
            (jwt.decode(adminToken) as any).id,
            (jwt.decode(userToken) as any).id
        ];
        for (const id of ids) {
            await prisma.refreshToken.deleteMany({ where: { userId: id } });
            await prisma.profile.delete({ where: { userId: id } });
            await prisma.user.delete({ where: { id } });
        }
        // Target user is deleted in the test itself usually, but let's be safe
        const target = await prisma.user.findUnique({ where: { id: targetUserId } });
        if (target) {
            await prisma.profile.delete({ where: { userId: targetUserId } });
            await prisma.user.delete({ where: { id: targetUserId } });
        }
    });

    describe('GET /admin/users', () => {
        it('should allow admin to list all users', async () => {
            const response = await request(app)
                .get('/admin/users')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(response.status).toBe(200);
            expect(Array.isArray(response.body.data.users)).toBe(true);
            expect(response.body.data.users.length).toBeGreaterThan(0);
        });

        it('should block regular user from listing users', async () => {
            const response = await request(app)
                .get('/admin/users')
                .set('Authorization', `Bearer ${userToken}`);

            expect(response.status).toBe(403);
        });
    });

    describe('PATCH /admin/users/:id/role', () => {
        it('should allow admin to change a user role', async () => {
            const response = await request(app)
                .patch(`/admin/users/${targetUserId}/role`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ role: 'ADMIN' });

            expect(response.status).toBe(200);

            const updated = await prisma.user.findUnique({ where: { id: targetUserId } });
            expect(updated?.role).toBe('ADMIN');
        });
    });

    describe('DELETE /admin/users/:id', () => {
        it('should allow admin to delete a user', async () => {
            const response = await request(app)
                .delete(`/admin/users/${targetUserId}`)
                .set('Authorization', `Bearer ${adminToken}`);

            expect(response.status).toBe(200);
            const deleted = await prisma.user.findUnique({ where: { id: targetUserId } });
            expect(deleted).toBeNull();
        });
    });
});
