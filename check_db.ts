import { PrismaClient } from "./src/generated/prisma/client";
const prisma = new PrismaClient();

async function main() {
    const placemarks = await prisma.placemark.findMany({
        include: {
            reviews: true
        }
    });
    console.log(JSON.stringify(placemarks, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
