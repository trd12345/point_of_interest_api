import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";

async function main() {
    const prisma = new PrismaClient();
    try {
        console.log("Fetching all placemarks...");
        const placemarks = await prisma.placemark.findMany({
            include: {
                user: {
                    include: {
                        profile: true
                    }
                },
                category: true
            }
        });
        console.log(`Success! Found ${placemarks.length} placemarks.`);
    } catch (e) {
        console.error("Prisma error:", e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
