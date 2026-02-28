// src/controllers/sales.controller.js
const { PrismaClient } = require('@prisma/client');
const { asyncHandler } = require('../utils/asyncHandler');
const { createError } = require('../middleware/errorHandler');
const salesService = require('../services/sales.service');

const prisma = new PrismaClient();

const getSales = asyncHandler(async (req, res) => {
    const { startDate, endDate, page = 1, limit = 50 } = req.query;
    const where = {};
    if (startDate || endDate) {
        where.saleDate = {};
        if (startDate) where.saleDate.gte = new Date(startDate);
        if (endDate) where.saleDate.lte = new Date(new Date(endDate).setHours(23, 59, 59, 999));
    }

    const [sales, total] = await Promise.all([
        prisma.sales.findMany({
            where,
            include: {
                product: { select: { id: true, name: true, sku: true } },
                soldBy: { select: { id: true, name: true } },
                materialSnapshots: { include: { material: { select: { id: true, name: true, unit: true } } } },
            },
            orderBy: { saleDate: 'desc' },
            skip: (+page - 1) * +limit,
            take: +limit,
        }),
        prisma.sales.count({ where }),
    ]);

    res.json({ success: true, data: sales, meta: { total, page: +page, limit: +limit } });
});

const getSale = asyncHandler(async (req, res) => {
    const sale = await prisma.sales.findUnique({
        where: { id: +req.params.id },
        include: {
            product: true,
            soldBy: { select: { id: true, name: true } },
            materialSnapshots: { include: { material: true } },
        },
    });
    if (!sale) throw createError('Sale not found', 404, 'NOT_FOUND');
    res.json({ success: true, data: sale });
});

const createSale = asyncHandler(async (req, res) => {
    const { productId, quantity = 1, paymentStatus, notes } = req.body;
    if (!productId) throw createError('productId is required', 400, 'VALIDATION_ERROR');

    const result = await salesService.createSale({
        productId: +productId,
        quantity: +quantity,
        paymentStatus,
        notes,
        soldById: req.user.id,
    });

    res.status(201).json({ success: true, data: result });
});

const updateSalePayment = asyncHandler(async (req, res) => {
    const { paymentStatus } = req.body;
    if (!paymentStatus) throw createError('paymentStatus is required', 400, 'VALIDATION_ERROR');

    const sale = await prisma.sales.update({
        where: { id: +req.params.id },
        data: { paymentStatus },
    });
    res.json({ success: true, data: sale });
});

module.exports = { getSales, getSale, createSale, updateSalePayment };
