// middleware/rbac.js

/**
 * Role-based access control middleware factory.
 * @param {...string} allowedRoles - Roles permitted to access the route.
 */
const authorize = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                error: { code: 'UNAUTHENTICATED', message: 'Not authenticated' },
            });
        }

        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                error: { code: 'FORBIDDEN', message: 'You do not have permission to access this resource' },
            });
        }

        next();
    };
};

module.exports = { authorize };
