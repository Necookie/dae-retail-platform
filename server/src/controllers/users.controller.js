// src/controllers/users.controller.js
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const { asyncHandler } = require('../utils/asyncHandler');
const { createError } = require('../middleware/errorHandler');

const prisma = new PrismaClient();
const safeSelect = { id: true, name: true, email: true, role: true, isActive: true, createdAt: true };

const getUsers = asyncHandler(async (req, res) => {
    const users = await prisma.user.findMany({ select: safeSelect, orderBy: { createdAt: 'desc' } });
    res.json({ success: true, data: users });
});

const getUser = asyncHandler(async (req, res) => {
    const user = await prisma.user.findUnique({ where: { id: +req.params.id }, select: safeSelect });
    if (!user) throw createError('User not found', 404, 'NOT_FOUND');
    res.json({ success: true, data: user });
});

const createUser = asyncHandler(async (req, res) => {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password) throw createError('name, email and password are required', 400, 'VALIDATION_ERROR');
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
        data: { name, email, passwordHash, role: role || 'STAFF' },
        select: safeSelect,
    });
    res.status(201).json({ success: true, data: user });
});

const updateUser = asyncHandler(async (req, res) => {
    const { name, email, password, role, isActive } = req.body;
    const data = {};
    if (name) data.name = name;
    if (email) data.email = email;
    if (role) data.role = role;
    if (isActive !== undefined) data.isActive = isActive;
    if (password) data.passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.update({ where: { id: +req.params.id }, data, select: safeSelect });
    res.json({ success: true, data: user });
});

const deleteUser = asyncHandler(async (req, res) => {
    if (+req.params.id === req.user.id) throw createError('Cannot delete your own account', 400, 'SELF_DELETE');
    await prisma.user.update({ where: { id: +req.params.id }, data: { isActive: false } });
    res.json({ success: true, message: 'User deactivated' });
});

module.exports = { getUsers, getUser, createUser, updateUser, deleteUser };
