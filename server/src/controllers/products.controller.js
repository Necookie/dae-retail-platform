// src/controllers/products.controller.js
const { PrismaClient } = require('@prisma/client');
const { asyncHandler } = require('../utils/asyncHandler');
const { createError } = require('../middleware/errorHandler');
const { calculateProductionCost } = require('../services/costing.service');
const { reserveMaterials, confirmDeduction, releaseReservations } = require('../services/inventory.service');
const { getCostingMethod } = require('../services/sales.service');

const prisma = new PrismaClient();

const getProducts = asyncHandler(async (req, res) => {
    const products = await prisma.product.findMany({
        where: { isActive: true },
        include: {
            productMaterials: { include: { material: { select: { id: true, name: true, unit: true } } } },
        },
        orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: products });
});

const getProduct = asyncHandler(async (req, res) => {
    const product = await prisma.product.findUnique({
        where: { id: +req.params.id },
        include: {
            productMaterials: { include: { material: true } },
            inventoryReservations: { where: { status: 'RESERVED' } },
        },
    });
    if (!product) throw createError('Product not found', 404, 'NOT_FOUND');
    res.json({ success: true, data: product });
});

const getProductCost = asyncHandler(async (req, res) => {
    const costingMethod = await getCostingMethod();
    const { totalCost, breakdown } = await calculateProductionCost(+req.params.id, costingMethod);
    res.json({ success: true, data: { costingMethod, totalCost, breakdown } });
});

const createProduct = asyncHandler(async (req, res) => {
    const { name, sku, description, sellingPrice, materials = [] } = req.body;
    if (!name || !sellingPrice) throw createError('name and sellingPrice are required', 400, 'VALIDATION_ERROR');

    const product = await prisma.$transaction(async (tx) => {
        const p = await tx.product.create({
            data: { name, sku, description, sellingPrice },
        });
        if (materials.length > 0) {
            await tx.productMaterial.createMany({
                data: materials.map((m) => ({
                    productId: p.id,
                    materialId: m.materialId,
                    quantityRequired: m.quantityRequired,
                })),
            });
        }
        return tx.product.findUnique({
            where: { id: p.id },
            include: { productMaterials: { include: { material: true } } },
        });
    });

    res.status(201).json({ success: true, data: product });
});

const updateProduct = asyncHandler(async (req, res) => {
    const { name, sku, description, sellingPrice, materials } = req.body;
    const productId = +req.params.id;

    const product = await prisma.$transaction(async (tx) => {
        const data = {};
        if (name !== undefined) data.name = name;
        if (sku !== undefined) data.sku = sku;
        if (description !== undefined) data.description = description;
        if (sellingPrice !== undefined) data.sellingPrice = sellingPrice;

        await tx.product.update({ where: { id: productId }, data });

        if (materials !== undefined) {
            await tx.productMaterial.deleteMany({ where: { productId } });
            if (materials.length > 0) {
                await tx.productMaterial.createMany({
                    data: materials.map((m) => ({
                        productId,
                        materialId: m.materialId,
                        quantityRequired: m.quantityRequired,
                    })),
                });
            }
        }

        return tx.product.findUnique({
            where: { id: productId },
            include: { productMaterials: { include: { material: true } } },
        });
    });

    res.json({ success: true, data: product });
});

const updateProductStatus = asyncHandler(async (req, res) => {
    const productId = +req.params.id;
    const { productionStatus, paymentStatus } = req.body;

    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) throw createError('Product not found', 404, 'NOT_FOUND');

    // Handle inventory reservation state machine
    if (productionStatus) {
        if (productionStatus === 'IN_PRODUCTION' && product.productionStatus === 'PENDING') {
            await reserveMaterials(productId);
        } else if (productionStatus === 'COMPLETED' && product.productionStatus === 'IN_PRODUCTION') {
            await confirmDeduction(productId);
        } else if (productionStatus === 'CANCELLED' && product.productionStatus === 'IN_PRODUCTION') {
            await releaseReservations(productId);
        }
    }

    const updated = await prisma.product.update({
        where: { id: productId },
        data: {
            ...(productionStatus && { productionStatus }),
            ...(paymentStatus && { paymentStatus }),
        },
    });

    res.json({ success: true, data: updated });
});

const deleteProduct = asyncHandler(async (req, res) => {
    await prisma.product.update({ where: { id: +req.params.id }, data: { isActive: false } });
    res.json({ success: true, message: 'Product deactivated' });
});

module.exports = { getProducts, getProduct, createProduct, updateProduct, deleteProduct, updateProductStatus, getProductCost };
