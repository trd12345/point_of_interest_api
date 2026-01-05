import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../app';
import { PrismaClient } from '../src/generated/prisma/client';
import bcrypt from 'bcrypt';
import { randomUUID, randomBytes } from 'crypto';

const prisma = new PrismaClient();
const generateObjectId = () => randomBytes(12).toString('hex');

describe('Authentication & Profile E2E Tests', () => {
    const testEmail = `test-${randomUUID()}@example.com`;
    const password = 'Password123!';
    let authToken: string;
    let userId: string;

    afterAll(async () => {
        // Cleanup test user
        const user = await prisma.user.findUnique({ where: { email: testEmail } });
        if (user) {
            await prisma.refreshToken.deleteMany({ where: { userId: user.id } });
            await prisma.profile.delete({ where: { userId: user.id } });
            await prisma.user.delete({ where: { id: user.id } });
        }
    });

    describe('POST /auth/register', () => {
        it('should register a new user successfully', async () => {
            const response = await request(app)
                .post('/auth/register')
                .send({
                    email: testEmail,
                    password: password,
                    first_name: 'Test',
                    last_name: 'User'
                });

            expect(response.status).toBe(200); // Controller returns 200
            expect(response.body.success).toBe(true);
            expect(response.body.message).toContain('Registered successfully');
        });

        it('should fail if email is already taken', async () => {
            const response = await request(app)
                .post('/auth/register')
                .send({
                    email: testEmail,
                    password: password,
                    first_name: 'Test',
                    last_name: 'User'
                });

            expect(response.status).toBe(422); // Controller returns 422 for EMAIL_TAKEN
            expect(response.body.errors.email).toBeDefined();
        });
    });

    describe('POST /auth/login', () => {
        it('should fail if email is not verified', async () => {
            const response = await request(app)
                .post('/auth/login')
                .send({
                    email: testEmail,
                    password: password
                });

            expect(response.status).toBe(400); // Controller returns 400
            expect(response.body.errors.general).toContain('Email is not verified');
        });

        it('should login successfully after verification', async () => {
            // Manually verify email in DB for test
            await prisma.user.update({
                where: { email: testEmail },
                data: { email_verified_at: new Date() }
            });

            const response = await request(app)
                .post('/auth/login')
                .send({
                    email: testEmail,
                    password: password
                });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('access_token');
            authToken = response.body.data.access_token;
            userId = response.body.data.user.id;
        });

        it('should fail with wrong password', async () => {
            const response = await request(app)
                .post('/auth/login')
                .send({
                    email: testEmail,
                    password: 'WrongPassword123!'
                });

            expect(response.status).toBe(400); // Controller returns 400
            expect(response.body.errors.general).toContain('Invalid credentials');
        });
    });

    describe('GET /auth/me', () => {
        it('should retrieve own profile', async () => {
            const response = await request(app)
                .get('/auth/me')
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(200);
            expect(response.body.data.user.email).toBe(testEmail);
        });
    });

    describe('PUT /auth/me', () => {
        it('should update profile name and contact info', async () => {
            const response = await request(app)
                .put('/auth/me')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    firstName: 'Updated',
                    lastName: 'User',
                    email: testEmail, // Email is required in update schema
                    contactEmail: 'contact@test.com'
                });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);

            // Verify in DB
            const updatedUser = await prisma.user.findUnique({
                where: { id: userId },
                include: { profile: true }
            });
            expect(updatedUser?.profile?.first_name).toBe('Updated');
            expect(updatedUser?.profile?.contact_email).toBe('contact@test.com');
        });
    });

    describe('POST /auth/change-password', () => {
        it('should change password successfully', async () => {
            const response = await request(app)
                .post('/auth/change-password')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    old_password: password,
                    new_password: 'NewPassword123!'
                });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);

            // Verify login with new password
            const loginRes = await request(app)
                .post('/auth/login')
                .send({
                    email: testEmail,
                    password: 'NewPassword123!'
                });
            expect(loginRes.status).toBe(200);
        });
    });
});
