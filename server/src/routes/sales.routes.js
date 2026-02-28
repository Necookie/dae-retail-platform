// src/routes/sales.routes.js
const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const {
    getSales, getSale, createSale, updateSalePayment,
} = require('../controllers/sales.controller');

router.use(authenticate);

router.get('/', getSales);
router.get('/:id', getSale);
router.post('/', createSale);
router.patch('/:id/payment', authorize('ADMIN', 'MANAGER'), updateSalePayment);

module.exports = router;
