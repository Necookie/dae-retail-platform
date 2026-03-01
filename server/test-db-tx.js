const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({ log: ['query', 'info', 'warn', 'error'] });

async function run() {
    try {
        console.log('--- FETCHING MATERIALS ---');
        const fuzzyWire = await prisma.rawMaterial.findFirst({
            where: { name: 'Test Fuzzy Wire' },
            include: { variants: true }
        });
        console.log('Found Material:', fuzzyWire?.name);
        const redVariant = fuzzyWire?.variants?.find(v => v.name === 'Red');

        if (!fuzzyWire || !redVariant) {
            console.log('Could not find material or variant');
            return;
        }

        console.log('\n--- CREATING PRODUCT DIRECTLY ---');

        const materials = [
            { materialId: fuzzyWire.id, variantId: redVariant.id, quantityRequired: 10 }
        ];

        const product = await prisma.$transaction(async (tx) => {
            const p = await tx.product.create({
                data: { name: 'Test Bouquet DB Direct ' + Date.now(), sku: 'TB-004-' + Date.now(), sellingPrice: 1500, description: 'Direct DB Test' },
            });
            if (materials.length > 0) {
                await tx.productMaterial.createMany({
                    data: materials.map((m) => ({
                        productId: p.id,
                        materialId: m.materialId,
                        variantId: m.variantId,
                        quantityRequired: m.quantityRequired,
                    })),
                });
            }
            return tx.product.findUnique({
                where: { id: p.id },
                include: { productMaterials: { include: { material: true, variant: true } } },
            });
        });

        console.log('✅ Product created:', product.name);
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
