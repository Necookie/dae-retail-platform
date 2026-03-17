// src/services/inventory.service.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { createError } = require('../middleware/errorHandler');

/**
 * Validates that enough stock exists to fulfill the BOM for a product.
 * @param {number} productId
 * @param {Object} tx - Prisma transaction client
 */
const validateStockAvailability = async (productId, tx) => {
    const db = tx || prisma;
    const bom = await db.productMaterial.findMany({
        where: { productId },
        include: { material: true, variant: true },
    });

    for (const item of bom) {
        if (parseFloat(item.variant.quantityOnHand) < parseFloat(item.quantityRequired)) {
            throw createError(
                `Insufficient stock for: ${item.material.name} - ${item.variant.name}. Available: ${item.variant.quantityOnHand} ${item.material.unit}, Required: ${item.quantityRequired} ${item.material.unit}`,
                400,
                'INSUFFICIENT_STOCK'
            );
        }
    }

    return bom;
};

/**
 * Reserves materials when product enters "IN_PRODUCTION" status.
 * Uses a DB transaction.
 */
const reserveMaterials = async (productId) => {
    return prisma.$transaction(async (tx) => {
        const bom = await validateStockAvailability(productId, tx);

        for (const item of bom) {
            // Deduct from on-hand (reserved)
            await tx.materialVariant.update({
                where: { id: item.variantId },
                data: { quantityOnHand: { decrement: item.quantityRequired } },
            });

            // Record reservation
            await tx.inventoryReservation.create({
                data: {
                    productId,
                    variantId: item.variantId,
                    reservedQty: item.quantityRequired,
                    status: 'RESERVED',
                },
            });

            // Record transaction
            await tx.transaction.create({
                data: {
                    type: 'RESERVATION',
                    referenceId: productId,
                    amount: 0,
                    notes: `Reserved ${item.quantityRequired} ${item.material.unit} of ${item.material.name} - ${item.variant.name} for product #${productId}`,
                },
            });
        }

        return { reserved: true, itemCount: bom.length };
    }, { maxWait: 10000, timeout: 30000 });
};

/**
 * Confirms deduction when production "COMPLETED".
 * Updates reservation records to DEDUCTED.
 */
const confirmDeduction = async (productId) => {
    return prisma.$transaction(async (tx) => {
        const reservations = await tx.inventoryReservation.findMany({
            where: { productId, status: 'RESERVED' },
        });

        for (const res of reservations) {
            await tx.inventoryReservation.update({
                where: { id: res.id },
                data: { status: 'DEDUCTED' },
            });

            await tx.transaction.create({
                data: {
                    type: 'ADJUSTMENT',
                    referenceId: productId,
                    amount: 0,
                    notes: `Confirmed deduction of ${res.reservedQty} for product #${productId}`,
                },
            });
        }

        return { deducted: true, itemCount: reservations.length };
    }, { maxWait: 10000, timeout: 30000 });
};

/**
 * Releases reservations when production "CANCELLED".
 * Returns stock back to on-hand.
 */
const releaseReservations = async (productId) => {
    return prisma.$transaction(async (tx) => {
        const reservations = await tx.inventoryReservation.findMany({
            where: { productId, status: 'RESERVED' },
        });

        for (const res of reservations) {
            // Return to on-hand
            await tx.materialVariant.update({
                where: { id: res.variantId },
                data: { quantityOnHand: { increment: res.reservedQty } },
            });

            await tx.inventoryReservation.update({
                where: { id: res.id },
                data: { status: 'RELEASED' },
            });

            await tx.transaction.create({
                data: {
                    type: 'CANCELLATION',
                    referenceId: productId,
                    amount: 0,
                    notes: `Released ${res.reservedQty} for product #${productId} (cancelled)`,
                },
            });
        }

        return { released: true, itemCount: reservations.length };
    }, { maxWait: 10000, timeout: 30000 });
};

module.exports = { reserveMaterials, confirmDeduction, releaseReservations, validateStockAvailability };
