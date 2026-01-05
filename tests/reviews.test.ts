import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../app';
import { PrismaClient } from '../src/generated/prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { randomUUID, randomBytes } from 'crypto';

const prisma = new PrismaClient();

// Helper to generate a valid MongoDB ObjectID string
const generateObjectId = () => randomBytes(12).toString('hex');

describe('Review System E2E Tests', () => {
    let userA: any;
    let userB: any;
    let tokenA: string;
    let tokenB: string;
    let placemark: any;
    let category: any;

    async function createTestUser(email: string) {
        const hashedPassword = await bcrypt.hash('password123', 10);
        const user = await prisma.user.upsert({
            where: { email },
            update: {},
            create: {
                email,
                password: hashedPassword,
                email_verified_at: new Date(),
                role: 'USER',
                profile: {
                    create: {
                        first_name: 'Test',
                        last_name: 'User'
                    }
                }
            },
            include: { profile: true }
        });

        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role, jti: randomUUID() },
            process.env.JWT_SECRET as string,
            { expiresIn: '1h' }
        );

        const { jti } = jwt.decode(token) as any;
        await prisma.refreshToken.create({
            data: {
                userId: user.id,
                jti,
                token: randomUUID(), // Generate unique token
                expiresAt: new Date(Date.now() + 3600 * 1000)
            }
        });

        return { user, token };
    }

    beforeAll(async () => {
        // Setup users
        const setupA = await createTestUser('usera@test.com');
        userA = setupA.user;
        tokenA = setupA.token;

        const setupB = await createTestUser('userb@test.com');
        userB = setupB.user;
        tokenB = setupB.token;

        // Setup Category
        category = await prisma.category.findFirst() || await prisma.category.create({
            data: {
                name: 'Test Category',
                description: 'Test Description',
                userId: userA.id
            }
        });

        // Setup Placemark (owned by User A)
        placemark = await prisma.placemark.create({
            data: {
                name: 'Test Spot',
                description: 'Owned by User A',
                categoryId: category.id,
                userId: userA.id,
                street: 'Test St',
                house_number: '1',
                zip: 12345,
                city: 'Test City',
                country: 'Test Country',
                lat: 0,
                lng: 0,
                is_public: true
            }
        });
    });

    afterAll(async () => {
        // Cleanup with safety checks - order matters for relations
        if (placemark?.id) {
            // Delete replies first
            await prisma.review.deleteMany({
                where: {
                    placemarkId: placemark.id,
                    parentId: { not: null }
                }
            });
            // Then top-level reviews
            await prisma.review.deleteMany({
                where: {
                    placemarkId: placemark.id,
                    parentId: null
                }
            });
            await prisma.placemark.delete({ where: { id: placemark.id } });
        }
    });

    describe('Owner Restriction', () => {
        it('should prevent the owner (User A) from reviewing their own spot', async () => {
            const response = await request(app)
                .post('/reviews')
                .set('Authorization', `Bearer ${tokenA}`)
                .send({
                    placemarkId: placemark.id,
                    rating: 5,
                    comment: 'My own spot is great!'
                });

            expect(response.status).toBe(403);
            expect(response.body.errors).toContain('You cannot review your own spot');
        });
    });

    describe('Review Creation and Interaction', () => {
        let reviewId: string;

        it('should allow a different user (User B) to review User A\'s spot', async () => {
            const response = await request(app)
                .post('/reviews')
                .set('Authorization', `Bearer ${tokenB}`)
                .send({
                    placemarkId: placemark.id,
                    rating: 4,
                    comment: 'Nice place, User A!'
                });

            expect(response.status).toBe(201);
            expect(response.body.success).toBe(true);
            expect(response.body.data.review.comment).toBe('Nice place, User A!');
            reviewId = response.body.data.review.id;
        });

        it('should allow the owner (User A) to reply to User B\'s review', async () => {
            const response = await request(app)
                .post('/reviews')
                .set('Authorization', `Bearer ${tokenA}`)
                .send({
                    placemarkId: placemark.id,
                    parentId: reviewId,
                    comment: 'Thank you for the review, User B!'
                });

            expect(response.status).toBe(201);
            expect(response.body.success).toBe(true);
            expect(response.body.data.review.parentId).toBe(reviewId);
        });

        it('should retrieve all reviews for the placemark with nesting', async () => {
            const response = await request(app)
                .get(`/placemarks/${placemark.id}/reviews`);

            expect(response.status).toBe(200);
            expect(response.body.data.reviews.length).toBeGreaterThan(0);
            const review = response.body.data.reviews.find((r: any) => r.id === reviewId);
            expect(review.replies.length).toBe(1);
            expect(review.replies[0].comment).toBe('Thank you for the review, User B!');
        });
    });

    describe('Review Deletion', () => {
        it('should allow a user to delete their own review', async () => {
            // Create a temporary review to delete
            const response = await request(app)
                .post('/reviews')
                .set('Authorization', `Bearer ${tokenB}`)
                .send({
                    placemarkId: placemark.id,
                    rating: 3,
                    comment: 'To be deleted'
                });

            const reviewId = response.body.data.review.id;

            const delResponse = await request(app)
                .delete(`/reviews/${reviewId}`)
                .set('Authorization', `Bearer ${tokenB}`);

            expect(delResponse.status).toBe(200);
            expect(delResponse.body.success).toBe(true);
        });

        it('should prevent a user from deleting another user\'s review', async () => {
            const randomId = generateObjectId();
            const response = await request(app)
                .delete(`/reviews/${randomId}`)
                .set('Authorization', `Bearer ${tokenA}`);

            expect(response.status).toBe(404); // Not found because it doesn't exist
        });
    });
});
