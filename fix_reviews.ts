import { PrismaClient } from "./src/generated/prisma/client";
const prisma = new PrismaClient();

async function main() {
    const result = await prisma.review.updateMany({
        where: {
            parentId: { isSet: false }
        } as any, // Cast because isSet might not be in the generated types yet
        data: {
            parentId: null
        }
    });
    console.log("Updated reviews count:", result.count);
}

main().catch(console.error).finally(() => prisma.$disconnect());
