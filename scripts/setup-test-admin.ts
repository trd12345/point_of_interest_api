import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import bcrypt from "bcrypt";

async function main() {
    const prisma = new PrismaClient();
    const email = "admin@demo.com";
    const password = "Password123!";
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.upsert({
        where: { email },
        update: {
            password: hashedPassword,
            role: "ADMIN",
            email_verified_at: new Date()
        },
        create: {
            email,
            password: hashedPassword,
            role: "ADMIN",
            email_verified_at: new Date(),
            profile: {
                create: {
                    first_name: "Admin",
                    last_name: "User"
                }
            }
        }
    });

    console.log(`Admin user ${user.email} ensured.`);

    const userEmail = "pamy@mailinator.com";
    const normalUser = await prisma.user.upsert({
        where: { email: userEmail },
        update: {
            password: hashedPassword,
            role: "USER",
            email_verified_at: new Date()
        },
        create: {
            email: userEmail,
            password: hashedPassword,
            role: "USER",
            email_verified_at: new Date(),
            profile: {
                create: {
                    first_name: "Pamy",
                    last_name: "Tester"
                }
            }
        }
    });
    console.log(`Normal user ${normalUser.email} ensured.`);
    await prisma.$disconnect();
}

main().catch(e => {
    console.error(e);
    process.exit(1);
});
