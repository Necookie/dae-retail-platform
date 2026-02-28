// src/controllers/settings.controller.js
const { PrismaClient } = require('@prisma/client');
const { asyncHandler } = require('../utils/asyncHandler');
const { createError } = require('../middleware/errorHandler');

const prisma = new PrismaClient();

const getSettings = asyncHandler(async (req, res) => {
    const settings = await prisma.systemSetting.findMany();
    // Convert to key-value map
    const settingsMap = settings.reduce((acc, s) => ({ ...acc, [s.key]: s.value }), {});
    res.json({ success: true, data: settingsMap });
});

const updateSetting = asyncHandler(async (req, res) => {
    const { key } = req.params;
    const { value } = req.body;
    if (value === undefined) throw createError('value is required', 400, 'VALIDATION_ERROR');

    const setting = await prisma.systemSetting.upsert({
        where: { key },
        update: { value: String(value) },
        create: { key, value: String(value) },
    });
    res.json({ success: true, data: setting });
});

module.exports = { getSettings, updateSetting };
