// src/routes/settings.routes.js
const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const { getSettings, updateSetting } = require('../controllers/settings.controller');

router.use(authenticate);

router.get('/', getSettings);
router.put('/:key', authorize('ADMIN'), updateSetting);

module.exports = router;
