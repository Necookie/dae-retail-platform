// src/controllers/auth.controller.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const { asyncHandler } = require('../utils/asyncHandler');
const { createError } = require('../middleware/errorHandler');

const prisma = new PrismaClient();

const login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        throw createError('Email and password are required', 400, 'VALIDATION_ERROR');
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.isActive) {
        throw createError('Invalid credentials', 401, 'INVALID_CREDENTIALS');
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
        throw createError('Invalid credentials', 401, 'INVALID_CREDENTIALS');
    }

    const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role, name: user.name },
        process.env.JWT_SECRET,
        { expiresIn: '8h' }
    );

    res.json({
        success: true,
        data: {
            token,
            user: { id: user.id, name: user.name, email: user.email, role: user.role },
        },
    });
});

const getMe = asyncHandler(async (req, res) => {
    const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: { id: true, name: true, email: true, role: true, createdAt: true },
    });
    res.json({ success: true, data: user });
});

module.exports = { login, getMe };
