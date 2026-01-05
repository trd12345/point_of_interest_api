import "dotenv/config";
import { beforeAll, afterAll, vi } from 'vitest';
import { PrismaClient } from '../src/generated/prisma/client';

const prisma = new PrismaClient();

// Suppress console.error during tests to keep output clean 
// (especially for intentional 400/403/404 errors)
if (process.env.NODE_ENV === 'test' || !process.env.NODE_ENV) {
    vi.spyOn(console, 'error').mockImplementation(() => { });
}

beforeAll(async () => {
    // Connect to the database before all tests
    await prisma.$connect();
});

afterAll(async () => {
    // Disconnect after all tests
    await prisma.$disconnect();
});
