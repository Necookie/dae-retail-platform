// src/services/sales.service.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { calculateProductionCost } = require('./costing.service');
const { createError } = require('../middleware/errorHandler');

/**
 * Gets the current costing method from system settings.
 */
const getCostingMethod = async (tx) => {
    const db = tx || prisma;
    const setting = await db.systemSetting.findUnique({ where: { key: 'costing_method' } });
    return setting?.value || 'WEIGHTED_AVERAGE';
};

/**
 * Creates a sale with a full production cost snapshot.
 * Uses a DB transaction to ensure atomicity.
 */
const createSale = async ({ productId, quantity = 1, paymentStatus = 'UNPAID', notes, soldById }) => {
    return prisma.$transaction(async (tx) => {
        // 1. Fetch product
        const product = await tx.product.findUnique({ where: { id: productId } });
        if (!product) throw createError('Product not found', 404, 'NOT_FOUND');
        if (!product.isActive) throw createError('Product is inactive', 400, 'PRODUCT_INACTIVE');

        // 2. Determine costing method and compute production cost
        const costingMethod = await getCostingMethod(tx);
        const { totalCost, breakdown } = await calculateProductionCost(productId, costingMethod);

        // 3. Calculate financials
        const unitPrice = parseFloat(product.sellingPrice);
        const totalRevenue = unitPrice * quantity;
        const productionCostSnapshot = totalCost * quantity;
        const profit = totalRevenue - productionCostSnapshot;

        // 4. Create the sale record
        const sale = await tx.sales.create({
            data: {
                productId,
                soldById,
                quantity,
                unitPrice,
                totalRevenue,
                productionCostSnapshot,
                profit,
                paymentStatus,
                notes,
            },
        });

        // 5. Create material cost snapshots (immutable historical record)
        for (const item of breakdown) {
            await tx.saleMaterialSnapshot.create({
                data: {
                    saleId: sale.id,
                    variantId: item.variantId,
                    unitCostSnapshot: item.unitCostSnapshot,
                    quantityUsed: item.quantityUsed * quantity,
                },
            });
        }

        // 6. Record the transaction
        await tx.transaction.create({
            data: {
                type: 'SALE',
                referenceId: sale.id,
                amount: totalRevenue,
                notes: `Sale of ${quantity}x ${product.name} @ ₱${unitPrice}`,
            },
        });

        return {
            sale,
            productionCostSnapshot,
            profit,
            costingMethod,
            breakdown,
        };
    }, { maxWait: 10000, timeout: 30000 });
};

module.exports = { createSale, getCostingMethod };
