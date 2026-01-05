import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";

async function main() {
    const prisma = new PrismaClient();
    try {
        console.log("Checking for orphaned placemarks...");
        const placemarks = await prisma.placemark.findMany();
        console.log(`Found ${placemarks.length} total placemarks.`);

        let deletedCount = 0;
        for (const p of placemarks) {
            const cat = await prisma.category.findUnique({ where: { id: p.categoryId } });
            if (!cat) {
                console.log(`Deleting orphan placemark: ${p.id} (Category ${p.categoryId} missing)`);
                await prisma.placemark.delete({ where: { id: p.id } });
                deletedCount++;
            }
        }
        console.log(`Cleanup complete. Deleted ${deletedCount} orphans.`);
    } catch (e) {
        console.error("Cleanup error:", e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
