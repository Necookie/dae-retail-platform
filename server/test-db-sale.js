const { PrismaClient } = require('@prisma/client');
const { createSale } = require('./src/services/sales.service');
const prisma = new PrismaClient({ log: ['query', 'info', 'warn', 'error'] });

async function run() {
    try {
        console.log('--- FETCHING PRODUCT FOR SALE ---');
        // Get the latest product
        const product = await prisma.product.findFirst({
            orderBy: { createdAt: 'desc' }
        });
        if (!product) { console.log('No product found'); return; }

        console.log('Found product:', product.name);

        const admin = await prisma.user.findFirst({ where: { email: 'test@dae.com' } });

        console.log('\n--- CREATING SALE DIRECTLY ---');
        const sale = await createSale({
            productId: product.id,
            quantity: 2,
            paymentStatus: 'PAID',
            notes: 'DB Direct Test Sale',
            soldById: admin?.id
        });

        console.log('✅ Sale created:', sale.sale.id, 'Profit:', sale.profit);
    } catch (e) {
        console.log('\n❌ Error Name:', e.name);
        console.log('❌ Error Message:', e.message);
        console.log('❌ Error Code:', e.code);
        console.log('❌ Error Meta:', e.meta);
        console.log('❌ Error Stack:', e.stack);
    } finally {
        await prisma.$disconnect();
    }
}
run();
