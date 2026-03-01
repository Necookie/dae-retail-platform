import { Navigate } from 'react-router-dom'
import useAuthStore from '../../store/authStore'
import { getDefaultRouteForRole } from '../../constants/access'

const HomeRedirect = () => {
    const { user } = useAuthStore()
    return <Navigate to={getDefaultRouteForRole(user?.role)} replace />
}

export default HomeRedirect
