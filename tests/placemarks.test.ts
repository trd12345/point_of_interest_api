import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../app';
import { PrismaClient } from '../src/generated/prisma/client';
import jwt from 'jsonwebtoken';
import { randomUUID, randomBytes } from 'crypto';

const prisma = new PrismaClient();
const generateObjectId = () => randomBytes(12).toString('hex');

describe('Placemark Management E2E Tests', () => {
    let ownerToken: string;
    let otherToken: string;
    let ownerId: string;
    let placemarkId: string;
    let category: any;

    async function createTestAuth(email: string) {
        const id = generateObjectId();
        await prisma.user.create({
            data: {
                id,
                email,
                password: 'password',
                email_verified_at: new Date(),
                role: 'USER',
                profile: { create: { first_name: 'Test', last_name: 'User' } }
            }
        });

        const token = jwt.sign(
            { id, email, role: 'USER', jti: randomUUID() },
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

        return { id, token };
    }

    beforeAll(async () => {
        const owner = await createTestAuth(`owner-${randomUUID()}@test.com`);
        ownerId = owner.id;
        ownerToken = owner.token;

        const other = await createTestAuth(`other-${randomUUID()}@test.com`);
        otherToken = other.token;

        category = await prisma.category.create({
            data: { name: `TestCat-${randomUUID()}`, userId: ownerId }
        });
    });

    afterAll(async () => {
        // Cleanup
        if (placemarkId) {
            await prisma.review.deleteMany({ where: { placemarkId } });
            await prisma.placemark.deleteMany({ where: { id: placemarkId } });
        }
        if (category?.id) {
            await prisma.category.delete({ where: { id: category.id } });
        }
        // Cleanup test users
        const userEmails = [
            (jwt.decode(ownerToken) as any).email,
            (jwt.decode(otherToken) as any).email
        ];
        for (const email of userEmails) {
            const user = await prisma.user.findUnique({ where: { email } });
            if (user) {
                await prisma.refreshToken.deleteMany({ where: { userId: user.id } });
                await prisma.profile.delete({ where: { userId: user.id } });
                await prisma.user.delete({ where: { id: user.id } });
            }
        }
    });

    describe('POST /placemarks', () => {
        it('should create a placemark successfully', async () => {
            const response = await request(app)
                .post('/placemarks')
                .set('Authorization', `Bearer ${ownerToken}`)
                .send({
                    name: 'E2E Test Spot',
                    description: 'Description',
                    categoryId: category.id,
                    street: 'Hidden St',
                    house_number: '123',
                    zip: 99999,
                    city: 'Test City',
                    country: 'Test Country',
                    lat: 10,
                    lng: 10,
                    is_public: true
                });

            expect(response.status).toBe(201);
            expect(response.body.success).toBe(true);
            placemarkId = response.body.data.placemark.id;
        });
    });

    describe('GET /placemarks/:id (Privacy Checks)', () => {
        it('should reveal full address to the owner', async () => {
            const response = await request(app)
                .get(`/placemarks/${placemarkId}`)
                .set('Authorization', `Bearer ${ownerToken}`);

            expect(response.status).toBe(200);
            expect(response.body.data.placemark.street).toBe('Hidden St');
        });

        it('should hide street and house number from others', async () => {
            const response = await request(app)
                .get(`/placemarks/${placemarkId}`)
                .set('Authorization', `Bearer ${otherToken}`);

            expect(response.status).toBe(200);
            expect(response.body.data.placemark.street).toBe('[HIDDEN]');
            expect(response.body.data.placemark.house_number).toBe('');
        });

        it('should hide street even if unauthenticated', async () => {
            const response = await request(app).get(`/placemarks/${placemarkId}`);
            expect(response.status).toBe(200);
            expect(response.body.data.placemark.street).toBe('[HIDDEN]');
        });
    });

    describe('PUT /placemarks/:id', () => {
        it('should allow owner to update', async () => {
            const response = await request(app)
                .put(`/placemarks/${placemarkId}`)
                .set('Authorization', `Bearer ${ownerToken}`)
                .send({ name: 'Updated Name' });

            expect(response.status).toBe(200);
            expect(response.body.data.placemark.name).toBe('Updated Name');
        });

        it('should prevent others from updating', async () => {
            const response = await request(app)
                .put(`/placemarks/${placemarkId}`)
                .set('Authorization', `Bearer ${otherToken}`)
                .send({ name: 'Hacker Name' });

            expect(response.status).toBe(403);
        });
    });

    describe('DELETE /placemarks/:id', () => {
        it('should allow owner to delete', async () => {
            const response = await request(app)
                .delete(`/placemarks/${placemarkId}`)
                .set('Authorization', `Bearer ${ownerToken}`);

            expect(response.status).toBe(200);
            const deleted = await prisma.placemark.findUnique({ where: { id: placemarkId } });
            expect(deleted).toBeNull();
        });
    });
});
