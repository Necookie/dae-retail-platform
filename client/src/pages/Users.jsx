import { useCallback, useEffect, useState } from 'react'
import {
    Button, Form, Input, Modal, Popconfirm, Select, Space, Switch, Table, Tag, Typography, message,
} from 'antd'
import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons'
import api from '../api/axios'
import useAuthStore from '../store/authStore'

const { Text } = Typography

const roleColors = {
    ADMIN: 'gold',
    MANAGER: 'blue',
    STAFF: 'default',
}

const Users = () => {
    const { user } = useAuthStore()
    const isAdmin = user?.role === 'ADMIN'
    const [users, setUsers] = useState([])
    const [loading, setLoading] = useState(true)
    const [modal, setModal] = useState({ open: false, item: null })
    const [form] = Form.useForm()

    const fetchUsers = useCallback(async () => {
        setLoading(true)
        try {
            const { data } = await api.get('/users')
            setUsers(data.data)
        } catch (err) {
            message.error(err.response?.data?.error?.message || 'Failed to load users')
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchUsers()
    }, [fetchUsers])

    const openModal = (item = null) => {
        setModal({ open: true, item })
        if (!item) {
            form.resetFields()
            form.setFieldsValue({ role: 'STAFF', isActive: true })
            return
        }

        form.setFieldsValue({
            name: item.name,
            email: item.email,
            role: item.role,
            isActive: item.isActive,
            password: '',
        })
    }

    const handleSave = async (values) => {
        try {
            if (modal.item) {
                await api.put(`/users/${modal.item.id}`, values)
                message.success('User updated')
            } else {
                await api.post('/users', values)
                message.success('User created')
            }
            setModal({ open: false, item: null })
            fetchUsers()
        } catch (err) {
            message.error(err.response?.data?.error?.message || 'Failed to save user')
        }
    }

    const handleDelete = async (id) => {
        try {
            await api.delete(`/users/${id}`)
            message.success('User deactivated')
            fetchUsers()
        } catch (err) {
            message.error(err.response?.data?.error?.message || 'Failed to deactivate user')
        }
    }

    const columns = [
        {
            title: 'User',
            dataIndex: 'name',
            key: 'name',
            render: (name, record) => (
                <div>
                    <Text strong>{name}</Text>
                    <Text type="secondary" style={{ display: 'block', fontSize: 12 }}>
                        {record.email}
                    </Text>
                </div>
            ),
        },
        {
            title: 'Role',
            dataIndex: 'role',
            key: 'role',
            width: 120,
            render: (role) => <Tag color={roleColors[role]}>{role}</Tag>,
        },
        {
            title: 'Status',
            dataIndex: 'isActive',
            key: 'isActive',
            width: 120,
            render: (isActive) => <Tag color={isActive ? 'green' : 'default'}>{isActive ? 'ACTIVE' : 'INACTIVE'}</Tag>,
        },
        {
            title: 'Actions',
            key: 'actions',
            width: 140,
            render: (_, record) => (
                <Space>
                    <Button size="small" icon={<EditOutlined />} onClick={() => openModal(record)} disabled={!isAdmin} />
                    <Popconfirm
                        title="Deactivate this user?"
                        onConfirm={() => handleDelete(record.id)}
                        disabled={!isAdmin || record.id === user?.id}
                    >
                        <Button
                            size="small"
                            danger
                            icon={<DeleteOutlined />}
                            disabled={!isAdmin || record.id === user?.id}
                        />
                    </Popconfirm>
                </Space>
            ),
        },
    ]

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Users</h1>
                    <p className="page-subtitle">Review staff access and manage account roles.</p>
                </div>
                <Button type="primary" icon={<PlusOutlined />} onClick={() => openModal()} disabled={!isAdmin}>
                    Add User
                </Button>
            </div>

            {!isAdmin && (
                <div className="info-banner">
                    Managers currently have read-only access to this screen. Write actions stay admin-only to match the API.
                </div>
            )}

            <Table
                dataSource={users}
                columns={columns}
                rowKey="id"
                loading={loading}
                pagination={{ pageSize: 20 }}
                style={{ background: 'white', borderRadius: 12 }}
            />

            <Modal
                title={modal.item ? 'Edit User' : 'Add User'}
                open={modal.open}
                onCancel={() => setModal({ open: false, item: null })}
                onOk={() => form.submit()}
                destroyOnClose
            >
                <Form form={form} layout="vertical" onFinish={handleSave} style={{ marginTop: 16 }}>
                    <Form.Item name="name" label="Full Name" rules={[{ required: true, message: 'Name is required' }]}>
                        <Input placeholder="Admin User" />
                    </Form.Item>
                    <Form.Item
                        name="email"
                        label="Email"
                        rules={[{ required: true, message: 'Email is required' }, { type: 'email', message: 'Enter a valid email' }]}
                    >
                        <Input placeholder="staff@pos.local" />
                    </Form.Item>
                    <Form.Item name="role" label="Role" rules={[{ required: true, message: 'Role is required' }]}>
                        <Select
                            options={[
                                { value: 'ADMIN', label: 'ADMIN' },
                                { value: 'MANAGER', label: 'MANAGER' },
                                { value: 'STAFF', label: 'STAFF' },
                            ]}
                        />
                    </Form.Item>
                    <Form.Item
                        name="password"
                        label={modal.item ? 'Reset Password' : 'Password'}
                        rules={modal.item ? [] : [{ required: true, message: 'Password is required' }]}
                    >
                        <Input.Password placeholder={modal.item ? 'Leave blank to keep current password' : 'Temporary password'} />
                    </Form.Item>
                    <Form.Item name="isActive" label="Active" valuePropName="checked">
                        <Switch />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    )
}

export default Users
