const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function run() {
    try {
        console.log('Seeding test data...');
        // 1. Create a user
        const hashedPassword = await bcrypt.hash('password123', 10);
        let user = await prisma.user.findFirst({ where: { email: 'test@dae.com' } });
        if (!user) {
            user = await prisma.user.create({
                data: {
                    name: 'Test Admin',
                    email: 'test@dae.com',
                    passwordHash: hashedPassword,
                    role: 'ADMIN',
                }
            });
            console.log('User created:', user.email);
        } else {
            console.log('User already exists:', user.email);
        }

        // 2. Create a Material with Variants
        let fuzzyWire = await prisma.rawMaterial.findFirst({ where: { name: 'Test Fuzzy Wire' } });
        if (!fuzzyWire) {
            fuzzyWire = await prisma.rawMaterial.create({
                data: {
                    name: 'Test Fuzzy Wire',
                    category: 'Core Materials',
                    unit: 'meter',
                    variants: {
                        create: [
                            { name: 'Red', sku: 'FW-RED-01', quantityOnHand: 0, reorderLevel: 10 },
                            { name: 'Blue', sku: 'FW-BLU-01', quantityOnHand: 0, reorderLevel: 10 }
                        ]
                    }
                },
                include: { variants: true }
            });
            console.log('Material created with variants:', fuzzyWire.name);
        } else {
            console.log('Material already exists:', fuzzyWire.name);
        }

        console.log('✅ Seed successful.');
    } catch (e) {
        console.log('❌ Error Name:', e.name);
        console.log('❌ Error Message:', e.message);
        console.log('❌ Error Code:', e.code);
        console.log('❌ Error Meta:', e.meta);
        console.log('❌ Error Stack:', e.stack);
    } finally {
        await prisma.$disconnect();
    }
}

run();
