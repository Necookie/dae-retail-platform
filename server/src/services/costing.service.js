// src/services/costing.service.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Resolves the unit cost of a material based on the active costing method.
 * @param {Object} material - The raw material record from DB
 * @param {string} costingMethod - WEIGHTED_AVERAGE | LATEST_PURCHASE | MANUAL_OVERRIDE
 * @returns {Decimal} unit cost
 */
const resolveMaterialCost = (material, costingMethod) => {
    switch (costingMethod) {
        case 'LATEST_PURCHASE':
            return material.latestUnitCost;
        case 'MANUAL_OVERRIDE':
            if (!material.manualUnitCost) {
                throw new Error(`No manual cost set for material: ${material.name}`);
            }
            return material.manualUnitCost;
        case 'WEIGHTED_AVERAGE':
        default:
            return material.weightedAvgCost;
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
        include: { material: true },
    });

    if (!bom.length) {
        return { totalCost: 0, breakdown: [] };
    }

    let totalCost = 0;
    const breakdown = [];

    for (const item of bom) {
        const unitCost = parseFloat(resolveMaterialCost(item.material, costingMethod));
        const qty = parseFloat(item.quantityRequired);
        const lineCost = unitCost * qty;
        totalCost += lineCost;

        breakdown.push({
            materialId: item.materialId,
            materialName: item.material.name,
            unit: item.material.unit,
            quantityUsed: qty,
            unitCostSnapshot: unitCost,
            lineCost,
        });
    }

    return { totalCost, breakdown };
};

/**
 * Updates weighted average cost of a material after a new purchase.
 * Formula: ((old_qty * old_avg) + (new_qty * new_cost)) / (old_qty + new_qty)
 */
const updateWeightedAverage = async (materialId, newQty, newUnitCost, tx) => {
    const db = tx || prisma;
    const material = await db.rawMaterial.findUnique({ where: { id: materialId } });
    const oldQty = parseFloat(material.quantityOnHand);
    const oldAvg = parseFloat(material.weightedAvgCost);
    const newAvgCost = oldQty + newQty === 0
        ? newUnitCost
        : ((oldQty * oldAvg) + (newQty * newUnitCost)) / (oldQty + newQty);

    await db.rawMaterial.update({
        where: { id: materialId },
        data: {
            weightedAvgCost: newAvgCost,
            latestUnitCost: newUnitCost,
        },
    });

    return newAvgCost;
};

module.exports = { calculateProductionCost, resolveMaterialCost, updateWeightedAverage };
