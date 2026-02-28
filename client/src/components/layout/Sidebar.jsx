// src/components/layout/Sidebar.jsx
import { Menu } from 'antd'
import {
    DashboardOutlined, InboxOutlined, AppstoreOutlined, ShoppingCartOutlined,
    BarChartOutlined, SettingOutlined,
} from '@ant-design/icons'
import { useNavigate, useLocation } from 'react-router-dom'

const menuItems = [
    { key: '/dashboard', icon: <DashboardOutlined />, label: 'Dashboard' },
    { key: '/inventory', icon: <InboxOutlined />, label: 'Inventory' },
    { key: '/products', icon: <AppstoreOutlined />, label: 'Arrangements' },
    { key: '/sales', icon: <ShoppingCartOutlined />, label: 'POS / Sales' },
    { key: '/reports', icon: <BarChartOutlined />, label: 'Reports' },
    { key: '/settings', icon: <SettingOutlined />, label: 'Settings' },
]

const Sidebar = ({ collapsed }) => {
    const navigate = useNavigate()
    const location = useLocation()

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
                items={menuItems}
                onClick={({ key }) => navigate(key)}
                style={{ marginTop: 8, border: 'none' }}
            />
        </>
    )
}

export default Sidebar
