// src/services/report.service.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Revenue and profit summary for a given date range.
 */
const getRevenueSummary = async ({ startDate, endDate }) => {
    const start = startDate ? new Date(startDate) : new Date(new Date().setDate(1)); // Start of month
    const end = endDate ? new Date(endDate) : new Date();

    const sales = await prisma.sales.findMany({
        where: { saleDate: { gte: start, lte: end } },
        include: { product: { select: { name: true, sku: true } } },
        orderBy: { saleDate: 'desc' },
    });

    const totalRevenue = sales.reduce((sum, s) => sum + parseFloat(s.totalRevenue), 0);
    const totalCost = sales.reduce((sum, s) => sum + parseFloat(s.productionCostSnapshot), 0);
    const totalProfit = sales.reduce((sum, s) => sum + parseFloat(s.profit), 0);
    const profitMargin = totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100).toFixed(2) : '0.00';

    return { totalRevenue, totalCost, totalProfit, profitMargin, salesCount: sales.length, sales };
};

/**
 * Inventory value summary.
 */
const getInventoryValue = async () => {
    const materials = await prisma.rawMaterial.findMany({ where: { isActive: true } });

    let totalValue = 0;
    const items = materials.map((m) => {
        const value = parseFloat(m.quantityOnHand) * parseFloat(m.weightedAvgCost);
        totalValue += value;
        return {
            id: m.id,
            name: m.name,
            unit: m.unit,
            quantityOnHand: parseFloat(m.quantityOnHand),
            weightedAvgCost: parseFloat(m.weightedAvgCost),
            totalValue: value,
            isLowStock: parseFloat(m.quantityOnHand) <= parseFloat(m.reorderLevel),
        };
    });

    return { totalValue, items };
};

/**
 * Top-selling products by quantity.
 */
const getTopProducts = async ({ limit = 5, startDate, endDate } = {}) => {
    const start = startDate ? new Date(startDate) : new Date(new Date().setDate(1));
    const end = endDate ? new Date(endDate) : new Date();

    const result = await prisma.sales.groupBy({
        by: ['productId'],
        where: { saleDate: { gte: start, lte: end } },
        _sum: { quantity: true, totalRevenue: true, profit: true },
        orderBy: { _sum: { quantity: 'desc' } },
        take: limit,
    });

    const products = await prisma.product.findMany({
        where: { id: { in: result.map((r) => r.productId) } },
        select: { id: true, name: true, sku: true },
    });

    return result.map((r) => {
        const product = products.find((p) => p.id === r.productId);
        return {
            productId: r.productId,
            productName: product?.name,
            sku: product?.sku,
            totalQuantity: r._sum.quantity,
            totalRevenue: parseFloat(r._sum.totalRevenue),
            totalProfit: parseFloat(r._sum.profit),
        };
    });
};

/**
 * Dashboard KPIs.
 */
const getDashboardKPIs = async () => {
    const today = new Date();
    const startOfToday = new Date(today.setHours(0, 0, 0, 0));
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const [todaysSales, monthSales, lowStockCount, pendingOrders] = await Promise.all([
        prisma.sales.aggregate({
            where: { saleDate: { gte: startOfToday } },
            _sum: { totalRevenue: true, profit: true },
            _count: true,
        }),
        prisma.sales.aggregate({
            where: { saleDate: { gte: startOfMonth } },
            _sum: { totalRevenue: true, profit: true },
            _count: true,
        }),
        prisma.rawMaterial.count({
            where: { isActive: true, quantityOnHand: { lte: prisma.rawMaterial.fields.reorderLevel } },
        }),
        prisma.product.count({ where: { productionStatus: 'PENDING' } }),
    ]);

    // Simplified low stock count
    const materials = await prisma.rawMaterial.findMany({ where: { isActive: true } });
    const lowStock = materials.filter(
        (m) => parseFloat(m.quantityOnHand) <= parseFloat(m.reorderLevel)
    ).length;

    return {
        today: {
            revenue: parseFloat(todaysSales._sum.totalRevenue) || 0,
            profit: parseFloat(todaysSales._sum.profit) || 0,
            salesCount: todaysSales._count,
        },
        month: {
            revenue: parseFloat(monthSales._sum.totalRevenue) || 0,
            profit: parseFloat(monthSales._sum.profit) || 0,
            salesCount: monthSales._count,
        },
        lowStockCount: lowStock,
        pendingOrders,
    };
};

module.exports = { getRevenueSummary, getInventoryValue, getTopProducts, getDashboardKPIs };
