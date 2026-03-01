// src/components/layout/Sidebar.jsx
import { Menu } from 'antd'
import {
    DashboardOutlined, InboxOutlined, AppstoreOutlined, ShoppingCartOutlined,
    BarChartOutlined, SettingOutlined, TeamOutlined,
} from '@ant-design/icons'
import { useNavigate, useLocation } from 'react-router-dom'
import useAuthStore from '../../store/authStore'
import { ROLES, isAllowedRole } from '../../constants/access'

const menuItems = [
    { key: '/dashboard', icon: <DashboardOutlined />, label: 'Dashboard', roles: [ROLES.ADMIN, ROLES.MANAGER] },
    { key: '/inventory', icon: <InboxOutlined />, label: 'Inventory' },
    { key: '/products', icon: <AppstoreOutlined />, label: 'Arrangements' },
    { key: '/sales', icon: <ShoppingCartOutlined />, label: 'POS / Sales' },
    { key: '/reports', icon: <BarChartOutlined />, label: 'Reports', roles: [ROLES.ADMIN, ROLES.MANAGER] },
    { key: '/users', icon: <TeamOutlined />, label: 'Users', roles: [ROLES.ADMIN, ROLES.MANAGER] },
    { key: '/settings', icon: <SettingOutlined />, label: 'Settings', roles: [ROLES.ADMIN] },
]

const Sidebar = ({ collapsed }) => {
    const navigate = useNavigate()
    const location = useLocation()
    const { user } = useAuthStore()
    const visibleMenuItems = menuItems.filter((item) => isAllowedRole(user?.role, item.roles))

    return (
        <>
            <div className="sidebar-logo">
                <img src="/logo.svg" alt="logo" className="logo-icon" />
                {!collapsed && <h2>dae artesania</h2>}
            </div>
            <Menu
                mode="inline"
                theme="light"
                selectedKeys={[location.pathname]}
                items={visibleMenuItems}
                onClick={({ key }) => navigate(key)}
                style={{ marginTop: 8, border: 'none' }}
            />
        </>
    )
}

export default Sidebar
