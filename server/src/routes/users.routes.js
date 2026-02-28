// src/routes/users.routes.js
const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const {
    getUsers, getUser, createUser, updateUser, deleteUser,
} = require('../controllers/users.controller');

router.use(authenticate);

router.get('/', authorize('ADMIN', 'MANAGER'), getUsers);
router.get('/:id', authorize('ADMIN', 'MANAGER'), getUser);
router.post('/', authorize('ADMIN'), createUser);
router.put('/:id', authorize('ADMIN'), updateUser);
router.delete('/:id', authorize('ADMIN'), deleteUser);

module.exports = router;
