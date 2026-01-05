import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../app';
import { PrismaClient } from '../src/generated/prisma/client';
import jwt from 'jsonwebtoken';
import { randomUUID, randomBytes } from 'crypto';

const prisma = new PrismaClient();
const generateObjectId = () => randomBytes(12).toString('hex');

describe('Category Management E2E Tests', () => {
    let adminToken: string;
    let userToken: string;
    let categoryId: string;

    async function createToken(role: string) {
        const id = generateObjectId();
        const email = `cat-${role.toLowerCase()}-${randomUUID()}@test.com`;
        const token = jwt.sign(
            { id, email, role, jti: randomUUID() },
            process.env.JWT_SECRET as string,
            { expiresIn: '1h' }
        );

        // Register token in DB to pass middleware check
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
        adminToken = await createToken('ADMIN');
        userToken = await createToken('USER');
    });

    describe('GET /categories', () => {
        it('should list all categories publicly', async () => {
            const response = await request(app).get('/categories');
            expect(response.status).toBe(200);
            expect(Array.isArray(response.body.data.categories)).toBe(true);
        });
    });

    describe('POST /categories', () => {
        it('should allow admin to create a category', async () => {
            const response = await request(app)
                .post('/categories')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    name: 'Test Category',
                    description: 'Testing purposes'
                });

            expect(response.status).toBe(201);
            expect(response.body.data.category.name).toBe('Test Category');
            categoryId = response.body.data.category.id;
        });

        it('should prevent normal user from creating a category', async () => {
            const response = await request(app)
                .post('/categories')
                .set('Authorization', `Bearer ${userToken}`)
                .send({
                    name: 'Hacker Category'
                });

            expect(response.status).toBe(403);
        });
    });

    describe('DELETE /categories/:id', () => {
        it('should prevent user from deleting a category', async () => {
            const response = await request(app)
                .delete(`/categories/${categoryId}`)
                .set('Authorization', `Bearer ${userToken}`);
            expect(response.status).toBe(403);
        });

        it('should allow admin to delete a category', async () => {
            const response = await request(app)
                .delete(`/categories/${categoryId}`)
                .set('Authorization', `Bearer ${adminToken}`);
            expect(response.status).toBe(200);

            // Verify deletion
            const deleted = await prisma.category.findUnique({ where: { id: categoryId } });
            expect(deleted).toBeNull();
        });
    });
});
