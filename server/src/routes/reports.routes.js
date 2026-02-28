// src/routes/reports.routes.js
const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const {
    getRevenueSummary, getInventoryValue, getTopProducts, getDashboardKPIs,
} = require('../controllers/reports.controller');

router.use(authenticate);
router.use(authorize('ADMIN', 'MANAGER'));

router.get('/dashboard', getDashboardKPIs);
router.get('/revenue', getRevenueSummary);
router.get('/inventory-value', getInventoryValue);
router.get('/top-products', getTopProducts);

module.exports = router;
