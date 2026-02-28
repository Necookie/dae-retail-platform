// src/components/layout/AppLayout.jsx
import { useState } from 'react'
import { Layout, Button, Avatar, Dropdown, Badge, Typography } from 'antd'
import { Outlet } from 'react-router-dom'
import {
    MenuFoldOutlined, MenuUnfoldOutlined, UserOutlined, LogoutOutlined, BellOutlined,
} from '@ant-design/icons'
import Sidebar from './Sidebar'
import useAuthStore from '../../store/authStore'

const { Sider, Header, Content } = Layout
const { Text } = Typography

const SIDER_WIDTH = 240

const AppLayout = () => {
    const [collapsed, setCollapsed] = useState(false)
    const { user, logout } = useAuthStore()

    const userMenu = {
        items: [
            { key: 'user', label: <><UserOutlined style={{ marginRight: 8 }} />{user?.name}</>, disabled: true },
            { type: 'divider' },
            {
                key: 'logout',
                label: <><LogoutOutlined style={{ marginRight: 8 }} />Logout</>,
                danger: true,
                onClick: logout,
            },
        ],
    }

    const siderWidth = collapsed ? 80 : SIDER_WIDTH

    return (
        <Layout style={{ minHeight: '100vh' }}>
            <Sider
                collapsible
                collapsed={collapsed}
                trigger={null}
                width={SIDER_WIDTH}
                collapsedWidth={80}
                style={{ overflow: 'auto', height: '100vh', position: 'fixed', left: 0, top: 0, bottom: 0, background: 'var(--sidebar-bg)' }}
                theme="light"
            >
                <Sidebar collapsed={collapsed} />
            </Sider>

            <Layout style={{ marginLeft: siderWidth, transition: 'margin-left 0.2s' }}>
                <Header className="ant-layout-header">
                    <div className="header-content">
                        <div className="header-left">
                            <Button
                                type="text"
                                icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                                onClick={() => setCollapsed(!collapsed)}
                                style={{ fontSize: 18, width: 44, height: 44 }}
                            />
                        </div>
                        <div className="header-right">
                            <Badge count={0} dot>
                                <Button type="text" icon={<BellOutlined style={{ fontSize: 18 }} />} />
                            </Badge>
                            <Dropdown menu={userMenu} placement="bottomRight">
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                                    <Avatar
                                        style={{ background: 'var(--primary)', cursor: 'pointer' }}
                                        icon={<UserOutlined />}
                                    />
                                    <div style={{ lineHeight: 1.2 }}>
                                        <Text strong style={{ display: 'block', fontSize: 13 }}>{user?.name}</Text>
                                        <Text type="secondary" style={{ fontSize: 11 }}>{user?.role}</Text>
                                    </div>
                                </div>
                            </Dropdown>
                        </div>
                    </div>
                </Header>

                <Content style={{ overflow: 'auto', background: 'var(--content-bg)' }}>
                    <div className="page-container fade-in">
                        <Outlet />
                    </div>
                </Content>
            </Layout>
        </Layout>
    )
}

export default AppLayout
