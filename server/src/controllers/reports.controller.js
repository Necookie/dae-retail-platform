// src/controllers/reports.controller.js
const { asyncHandler } = require('../utils/asyncHandler');
const reportService = require('../services/report.service');

const getRevenueSummary = asyncHandler(async (req, res) => {
    const { startDate, endDate } = req.query;
    const data = await reportService.getRevenueSummary({ startDate, endDate });
    res.json({ success: true, data });
});

const getInventoryValue = asyncHandler(async (req, res) => {
    const data = await reportService.getInventoryValue();
    res.json({ success: true, data });
});

const getTopProducts = asyncHandler(async (req, res) => {
    const { limit, startDate, endDate } = req.query;
    const data = await reportService.getTopProducts({ limit: +limit || 5, startDate, endDate });
    res.json({ success: true, data });
});

const getDashboardKPIs = asyncHandler(async (req, res) => {
    const data = await reportService.getDashboardKPIs();
    res.json({ success: true, data });
});

module.exports = { getRevenueSummary, getInventoryValue, getTopProducts, getDashboardKPIs };
