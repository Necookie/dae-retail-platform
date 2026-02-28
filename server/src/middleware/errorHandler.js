// middleware/errorHandler.js

const errorHandler = (err, req, res, next) => {
    console.error('[ERROR]', err);

    // Zod validation errors
    if (err.name === 'ZodError') {
        return res.status(400).json({
            success: false,
            error: {
                code: 'VALIDATION_ERROR',
                message: 'Invalid request data',
                details: err.errors,
            },
        });
    }

    // Prisma known errors
    if (err.code === 'P2002') {
        return res.status(409).json({
            success: false,
            error: { code: 'DUPLICATE_ENTRY', message: 'A record with this value already exists' },
        });
    }

    if (err.code === 'P2025') {
        return res.status(404).json({
            success: false,
            error: { code: 'NOT_FOUND', message: 'Record not found' },
        });
    }

    // Custom app errors
    if (err.statusCode) {
        return res.status(err.statusCode).json({
            success: false,
            error: { code: err.code || 'APP_ERROR', message: err.message },
        });
    }

    // Generic server error
    res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' },
    });
};

/**
 * Creates a custom application error.
 */
const createError = (message, statusCode = 500, code = 'APP_ERROR') => {
    const err = new Error(message);
    err.statusCode = statusCode;
    err.code = code;
    return err;
};

module.exports = { errorHandler, createError };
