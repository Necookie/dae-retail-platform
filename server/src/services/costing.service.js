// src/services/costing.service.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Resolves the unit cost of a material based on the active costing method.
 * @param {Object} variant - The material variant record from DB
 * @param {string} costingMethod - WEIGHTED_AVERAGE | LATEST_PURCHASE | MANUAL_OVERRIDE
 * @returns {Decimal} unit cost
 */
const resolveMaterialCost = (variant, costingMethod) => {
    switch (costingMethod) {
        case 'LATEST_PURCHASE':
            return variant.latestUnitCost;
        case 'MANUAL_OVERRIDE':
            if (!variant.manualUnitCost) {
                // If variant has no manual cost, we'll try to fallback, but ideally it should
                throw new Error(`No manual cost set for variant: ${variant.name}`);
            }
            return variant.manualUnitCost;
        case 'WEIGHTED_AVERAGE':
        default:
            return variant.weightedAvgCost;
    }
};

/**
 * Calculates the production cost of a product given its BOM.
 * @param {number} productId
 * @param {string} costingMethod
 * @returns {{ totalCost: number, breakdown: Array }}
 */
const calculateProductionCost = async (productId, costingMethod) => {
    const bom = await prisma.productMaterial.findMany({
        where: { productId },
        include: {
            material: true,
            variant: true
        },
    });

    if (!bom.length) {
        return { totalCost: 0, breakdown: [] };
    }

    let totalCost = 0;
    const breakdown = [];

    for (const item of bom) {
        const unitCost = parseFloat(resolveMaterialCost(item.variant, costingMethod));
        const qty = parseFloat(item.quantityRequired);
        const lineCost = unitCost * qty;
        totalCost += lineCost;

        breakdown.push({
            materialId: item.materialId,
            variantId: item.variantId,
            materialName: `${item.material.name} - ${item.variant.name}`,
            unit: item.material.unit,
            quantityUsed: qty,
            unitCostSnapshot: unitCost,
            lineCost,
        });
    }

    return { totalCost, breakdown };
};

/**
 * Updates weighted average cost of a material variant after a new purchase.
 * Formula: ((old_qty * old_avg) + (new_qty * new_cost)) / (old_qty + new_qty)
 */
const updateWeightedAverage = async (variantId, newQty, newUnitCost, tx) => {
    const db = tx || prisma;
    const variant = await db.materialVariant.findUnique({ where: { id: variantId } });
    const oldQty = parseFloat(variant.quantityOnHand);
    const oldAvg = parseFloat(variant.weightedAvgCost);
    const newAvgCost = oldQty + newQty === 0
        ? newUnitCost
        : ((oldQty * oldAvg) + (newQty * newUnitCost)) / (oldQty + newQty);

    await db.materialVariant.update({
        where: { id: variantId },
        data: {
            weightedAvgCost: newAvgCost,
            latestUnitCost: newUnitCost,
        },
    });

    return newAvgCost;
};

module.exports = { calculateProductionCost, resolveMaterialCost, updateWeightedAverage };
