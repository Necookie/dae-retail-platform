// src/routes/materials.routes.js
const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const {
    getMaterials, getMaterial, createMaterial, updateMaterial, deleteMaterial,
    getMaterialPurchases, createPurchase,
} = require('../controllers/materials.controller');

router.use(authenticate);

router.get('/', getMaterials);
router.get('/:id', getMaterial);
router.post('/', authorize('ADMIN', 'MANAGER'), createMaterial);
router.put('/:id', authorize('ADMIN', 'MANAGER'), updateMaterial);
router.delete('/:id', authorize('ADMIN'), deleteMaterial);

// Purchase history
router.get('/:id/purchases', getMaterialPurchases);
router.post('/:id/purchases', authorize('ADMIN', 'MANAGER'), createPurchase);

module.exports = router;
