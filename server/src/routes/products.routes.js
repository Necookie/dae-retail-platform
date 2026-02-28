// src/routes/products.routes.js
const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const {
    getProducts, getProduct, createProduct, updateProduct, deleteProduct,
    updateProductStatus, getProductCost,
} = require('../controllers/products.controller');

router.use(authenticate);

router.get('/', getProducts);
router.get('/:id', getProduct);
router.get('/:id/cost', getProductCost);
router.post('/', authorize('ADMIN', 'MANAGER'), createProduct);
router.put('/:id', authorize('ADMIN', 'MANAGER'), updateProduct);
router.patch('/:id/status', authorize('ADMIN', 'MANAGER', 'STAFF'), updateProductStatus);
router.delete('/:id', authorize('ADMIN'), deleteProduct);

module.exports = router;
