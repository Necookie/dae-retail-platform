export const ROLES = {
    ADMIN: 'ADMIN',
    MANAGER: 'MANAGER',
    STAFF: 'STAFF',
}

export const isAllowedRole = (userRole, allowedRoles = []) => {
    if (!allowedRoles?.length) return true
    return allowedRoles.includes(userRole)
}

export const getDefaultRouteForRole = (role) => {
    if (role === ROLES.STAFF) return '/sales'
    return '/dashboard'
}
