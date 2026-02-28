// src/pages/Login.jsx
import { useEffect } from 'react'
import { Form, Input, Button, Alert, Typography } from 'antd'
import { UserOutlined, LockOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import useAuthStore from '../store/authStore'

const { Title, Text } = Typography

const Login = () => {
    const navigate = useNavigate()
    const { login, isLoading, error, token, clearError } = useAuthStore()

    useEffect(() => {
        if (token) navigate('/dashboard', { replace: true })
    }, [token, navigate])

    const handleSubmit = async (values) => {
        clearError()
        const result = await login(values.email, values.password)
        if (result.success) navigate('/dashboard')
    }

    return (
        <div className="login-container">
            <div className="login-card ant-card" style={{ padding: 40 }}>
                <div className="login-logo">
                    <div style={{ fontSize: 48 }}>🏪</div>
                    <Title level={2} style={{ margin: '8px 0 4px', background: 'linear-gradient(135deg, #4f46e5, #818cf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                        POS System
                    </Title>
                    <Text type="secondary">Internal Staff Portal — Sign in to continue</Text>
                </div>

                {error && (
                    <Alert message={error} type="error" showIcon style={{ marginBottom: 20, borderRadius: 8 }} />
                )}

                <Form layout="vertical" onFinish={handleSubmit} size="large">
                    <Form.Item
                        name="email"
                        rules={[{ required: true, message: 'Email is required' }, { type: 'email', message: 'Enter a valid email' }]}
                    >
                        <Input prefix={<UserOutlined style={{ color: '#9ca3af' }} />} placeholder="Email address" />
                    </Form.Item>
                    <Form.Item
                        name="password"
                        rules={[{ required: true, message: 'Password is required' }]}
                    >
                        <Input.Password prefix={<LockOutlined style={{ color: '#9ca3af' }} />} placeholder="Password" />
                    </Form.Item>
                    <Form.Item style={{ marginBottom: 0 }}>
                        <Button
                            type="primary"
                            htmlType="submit"
                            loading={isLoading}
                            block
                            size="large"
                            style={{ height: 48, fontSize: 16, fontWeight: 600 }}
                        >
                            Sign In
                        </Button>
                    </Form.Item>
                </Form>

                <div style={{ textAlign: 'center', marginTop: 24, padding: '16px', background: '#f8fafc', borderRadius: 8, border: '1px solid #e5e7eb' }}>
                    <Text type="secondary" style={{ fontSize: 13 }}>
                        Default: <strong>admin@pos.local</strong> / <strong>admin123</strong>
                    </Text>
                </div>
            </div>
        </div>
    )
}

export default Login
