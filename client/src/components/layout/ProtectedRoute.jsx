// src/components/layout/ProtectedRoute.jsx
import { Navigate } from 'react-router-dom'
import useAuthStore from '../../store/authStore'
import { getDefaultRouteForRole, isAllowedRole } from '../../constants/access'

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
    const { token, user } = useAuthStore()
    if (!token) return <Navigate to="/login" replace />
    if (!isAllowedRole(user?.role, allowedRoles)) {
        return <Navigate to={getDefaultRouteForRole(user?.role)} replace />
    }
    return children
}

export default ProtectedRoute
