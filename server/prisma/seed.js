// prisma/seed.js
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding database...');

    // ── Admin User ────────────────────────────────────────────────────────────
    const passwordHash = await bcrypt.hash('admin123', 10);
    const admin = await prisma.user.upsert({
        where: { email: 'admin@pos.local' },
        update: {},
        create: {
            name: 'Admin User',
            email: 'admin@pos.local',
            passwordHash,
            role: 'ADMIN',
        },
    });
    console.log(`✅ Admin user: ${admin.email}`);

    // ── Raw Materials ─────────────────────────────────────────────────────────
    const red_wire = await prisma.rawMaterial.upsert({
        where: { id: 1 },
        update: {},
        create: {
            name: 'Red Fuzzy Wire',
            unit: 'pc',
            quantityOnHand: 50,
            reorderLevel: 10,
            weightedAvgCost: 2.50,
            latestUnitCost: 2.50,
        },
    });

    const stem_wire = await prisma.rawMaterial.upsert({
        where: { id: 2 },
        update: {},
        create: {
            name: 'Green Stem Wire',
            unit: 'pc',
            quantityOnHand: 30,
            reorderLevel: 5,
            weightedAvgCost: 3.00,
            latestUnitCost: 3.00,
        },
    });

    const floral_tape = await prisma.rawMaterial.upsert({
        where: { id: 3 },
        update: {},
        create: {
            name: 'Floral Tape',
            unit: 'roll',
            quantityOnHand: 20,
            reorderLevel: 3,
            weightedAvgCost: 45.00,
            latestUnitCost: 45.00,
        },
    });

    const satin_ribbon = await prisma.rawMaterial.upsert({
        where: { id: 4 },
        update: {},
        create: {
            name: 'Satin Ribbon - Nude',
            unit: 'meter',
            quantityOnHand: 200,
            reorderLevel: 30,
            weightedAvgCost: 15.00,
            latestUnitCost: 15.00,
        },
    });

    console.log(`✅ Raw materials seeded`);

    // ── Sample Product ────────────────────────────────────────────────────────
    const product = await prisma.product.upsert({
        where: { sku: 'ARRG-ROSE-001' },
        update: {},
        create: {
            name: 'Classic Red Rose Arrangement',
            sku: 'ARRG-ROSE-001',
            description: 'A structured premium arrangement of red fuzzywire roses wrapped in kraft sheet',
            sellingPrice: 1250.00,
            productionStatus: 'PENDING',
            paymentStatus: 'UNPAID',
        },
    });

    // Product BOM (Build Components)
    await prisma.productMaterial.upsert({
        where: { productId_materialId: { productId: product.id, materialId: red_wire.id } },
        update: {},
        create: { productId: product.id, materialId: red_wire.id, quantityRequired: 15 },
    });
    await prisma.productMaterial.upsert({
        where: { productId_materialId: { productId: product.id, materialId: stem_wire.id } },
        update: {},
        create: { productId: product.id, materialId: stem_wire.id, quantityRequired: 5 },
    });
    await prisma.productMaterial.upsert({
        where: { productId_materialId: { productId: product.id, materialId: floral_tape.id } },
        update: {},
        create: { productId: product.id, materialId: floral_tape.id, quantityRequired: 1 },
    });
    await prisma.productMaterial.upsert({
        where: { productId_materialId: { productId: product.id, materialId: satin_ribbon.id } },
        update: {},
        create: { productId: product.id, materialId: satin_ribbon.id, quantityRequired: 2 },
    });

    console.log(`✅ Sample arrangement seeded: ${product.name}`);

    // ── System Settings ───────────────────────────────────────────────────────
    const settings = [
        { key: 'costing_method', value: 'WEIGHTED_AVERAGE' },
        { key: 'tax_rate', value: '0' },
        { key: 'currency', value: 'PHP' },
        { key: 'business_name', value: 'Fuzzywire Atelier' },
    ];

    for (const setting of settings) {
        await prisma.systemSetting.upsert({
            where: { key: setting.key },
            update: {},
            create: setting,
        });
    }
    console.log(`✅ System settings seeded`);

    console.log('\n🎉 Seeding complete!');
    console.log('   Admin login: admin@pos.local / admin123');
}

main()
    .catch((e) => {
        console.error('❌ Seed failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
