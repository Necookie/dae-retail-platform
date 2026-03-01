// src/controllers/materials.controller.js
const { PrismaClient } = require('@prisma/client');
const { asyncHandler } = require('../utils/asyncHandler');
const { createError } = require('../middleware/errorHandler');
const { updateWeightedAverage } = require('../services/costing.service');

const prisma = new PrismaClient();

const getMaterials = asyncHandler(async (req, res) => {
    const materials = await prisma.rawMaterial.findMany({
        where: { isActive: true },
        include: {
            variants: { where: { isActive: true }, orderBy: { name: 'asc' } }
        },
        orderBy: { name: 'asc' },
    });
    res.json({ success: true, data: materials });
});

const getMaterial = asyncHandler(async (req, res) => {
    const material = await prisma.rawMaterial.findUnique({
        where: { id: +req.params.id },
        include: { variants: { where: { isActive: true } } }
    });
    if (!material) throw createError('Material not found', 404, 'NOT_FOUND');
    res.json({ success: true, data: material });
});

const createMaterial = asyncHandler(async (req, res) => {
    const { name, category, unit, variants } = req.body;
    if (!name || !unit) throw createError('name and unit are required', 400, 'VALIDATION_ERROR');

    const material = await prisma.rawMaterial.create({
        data: {
            name,
            category,
            unit,
            variants: {
                create: variants && variants.length > 0 ? variants.map(v => ({
                    name: v.name,
                    sku: v.sku,
                    quantityOnHand: v.quantityOnHand || 0,
                    reorderLevel: v.reorderLevel || 0,
                    manualUnitCost: v.manualUnitCost
                })) : [{
                    name: 'Standard',
                    quantityOnHand: 0,
                    reorderLevel: 0
                }]
            }
        },
        include: { variants: true }
    });
    res.status(201).json({ success: true, data: material });
});

const updateMaterial = asyncHandler(async (req, res) => {
    const { name, category, unit, isActive, variants } = req.body;
    const data = {};
    if (name !== undefined) data.name = name;
    if (category !== undefined) data.category = category;
    if (unit !== undefined) data.unit = unit;
    if (isActive !== undefined) data.isActive = isActive;

    const materialId = +req.params.id;

    const result = await prisma.$transaction(async (tx) => {
        // Update base material
        if (Object.keys(data).length > 0) {
            await tx.rawMaterial.update({ where: { id: materialId }, data });
        }

        // Handle variants if provided
        if (variants && Array.isArray(variants)) {
            for (const v of variants) {
                if (v.id) {
                    // Update existing variant
                    const variantData = {};
                    if (v.name !== undefined) variantData.name = v.name;
                    if (v.sku !== undefined) variantData.sku = v.sku;
                    if (v.quantityOnHand !== undefined) variantData.quantityOnHand = v.quantityOnHand;
                    if (v.reorderLevel !== undefined) variantData.reorderLevel = v.reorderLevel;
                    if (v.manualUnitCost !== undefined) variantData.manualUnitCost = v.manualUnitCost;
                    if (v.isActive !== undefined) variantData.isActive = v.isActive;

                    if (Object.keys(variantData).length > 0) {
                        await tx.materialVariant.update({ where: { id: v.id }, data: variantData });
                    }
                } else {
                    // Create new variant
                    await tx.materialVariant.create({
                        data: {
                            materialId,
                            name: v.name,
                            sku: v.sku,
                            quantityOnHand: v.quantityOnHand || 0,
                            reorderLevel: v.reorderLevel || 0,
                            manualUnitCost: v.manualUnitCost
                        }
                    });
                }
            }
        }

        return await tx.rawMaterial.findUnique({
            where: { id: materialId },
            include: { variants: true }
        });
    });

    res.json({ success: true, data: result });
});

const deleteMaterial = asyncHandler(async (req, res) => {
    await prisma.rawMaterial.update({ where: { id: +req.params.id }, data: { isActive: false } });
    res.json({ success: true, message: 'Material deactivated' });
});

const getMaterialPurchases = asyncHandler(async (req, res) => {
    const purchases = await prisma.purchase.findMany({
        where: { variant: { materialId: +req.params.id } },
        include: { variant: true },
        orderBy: { purchaseDate: 'desc' },
    });
    res.json({ success: true, data: purchases });
});

const createPurchase = asyncHandler(async (req, res) => {
    // Note: params.id is the base Material ID, body should contain variantId
    const { variantId, quantity, unitCost, supplier, notes } = req.body;
    if (!variantId || !quantity || !unitCost) throw createError('variantId, quantity and unitCost are required', 400, 'VALIDATION_ERROR');

    const totalCost = parseFloat(quantity) * parseFloat(unitCost);

    const result = await prisma.$transaction(async (tx) => {
        // Update weighted average and latest cost for the VARIANT
        await updateWeightedAverage(variantId, parseFloat(quantity), parseFloat(unitCost), tx);

        // Add to on-hand quantity for the VARIANT
        await tx.materialVariant.update({
            where: { id: variantId },
            data: { quantityOnHand: { increment: quantity } },
        });

        // Create purchase record linking to the VARIANT
        const purchase = await tx.purchase.create({
            data: { variantId, quantity, unitCost, totalCost, supplier, notes },
        });

        // Record transaction
        await tx.transaction.create({
            data: {
                type: 'PURCHASE',
                referenceId: purchase.id,
                amount: totalCost,
                notes: `Purchase of ${quantity} units @ ${unitCost} each`,
            },
        });

        return purchase;
    });

    res.status(201).json({ success: true, data: result });
});

module.exports = {
    getMaterials, getMaterial, createMaterial, updateMaterial, deleteMaterial,
    getMaterialPurchases, createPurchase,
};
