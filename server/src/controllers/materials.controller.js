// src/controllers/materials.controller.js
const { PrismaClient } = require('@prisma/client');
const { asyncHandler } = require('../utils/asyncHandler');
const { createError } = require('../middleware/errorHandler');
const { updateWeightedAverage } = require('../services/costing.service');

const prisma = new PrismaClient();

const getMaterials = asyncHandler(async (req, res) => {
    const materials = await prisma.rawMaterial.findMany({
        where: { isActive: true },
        orderBy: { name: 'asc' },
    });
    res.json({ success: true, data: materials });
});

const getMaterial = asyncHandler(async (req, res) => {
    const material = await prisma.rawMaterial.findUnique({ where: { id: +req.params.id } });
    if (!material) throw createError('Material not found', 404, 'NOT_FOUND');
    res.json({ success: true, data: material });
});

const createMaterial = asyncHandler(async (req, res) => {
    const { name, unit, quantityOnHand = 0, reorderLevel = 0, manualUnitCost } = req.body;
    if (!name || !unit) throw createError('name and unit are required', 400, 'VALIDATION_ERROR');
    const material = await prisma.rawMaterial.create({
        data: { name, unit, quantityOnHand, reorderLevel, manualUnitCost },
    });
    res.status(201).json({ success: true, data: material });
});

const updateMaterial = asyncHandler(async (req, res) => {
    const { name, unit, reorderLevel, manualUnitCost, isActive } = req.body;
    const data = {};
    if (name !== undefined) data.name = name;
    if (unit !== undefined) data.unit = unit;
    if (reorderLevel !== undefined) data.reorderLevel = reorderLevel;
    if (manualUnitCost !== undefined) data.manualUnitCost = manualUnitCost;
    if (isActive !== undefined) data.isActive = isActive;

    const material = await prisma.rawMaterial.update({ where: { id: +req.params.id }, data });
    res.json({ success: true, data: material });
});

const deleteMaterial = asyncHandler(async (req, res) => {
    await prisma.rawMaterial.update({ where: { id: +req.params.id }, data: { isActive: false } });
    res.json({ success: true, message: 'Material deactivated' });
});

const getMaterialPurchases = asyncHandler(async (req, res) => {
    const purchases = await prisma.purchase.findMany({
        where: { materialId: +req.params.id },
        orderBy: { purchaseDate: 'desc' },
    });
    res.json({ success: true, data: purchases });
});

const createPurchase = asyncHandler(async (req, res) => {
    const materialId = +req.params.id;
    const { quantity, unitCost, supplier, notes } = req.body;
    if (!quantity || !unitCost) throw createError('quantity and unitCost are required', 400, 'VALIDATION_ERROR');

    const totalCost = parseFloat(quantity) * parseFloat(unitCost);

    const result = await prisma.$transaction(async (tx) => {
        // Update weighted average and latest cost
        await updateWeightedAverage(materialId, parseFloat(quantity), parseFloat(unitCost), tx);

        // Add to on-hand quantity
        await tx.rawMaterial.update({
            where: { id: materialId },
            data: { quantityOnHand: { increment: quantity } },
        });

        // Create purchase record
        const purchase = await tx.purchase.create({
            data: { materialId, quantity, unitCost, totalCost, supplier, notes },
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
