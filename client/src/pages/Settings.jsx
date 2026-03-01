import { useState, useEffect } from 'react'
import { Card, Form, Select, Input, Button, Typography, Divider, message, Row, Col, InputNumber, Tabs } from 'antd'
import { SettingOutlined, SaveOutlined } from '@ant-design/icons'
import useSettingsStore from '../store/settingsStore'

const { Title, Text } = Typography

const Settings = () => {
    const { settings, isLoaded, fetchSettings, updateSetting } = useSettingsStore()
    const [form] = Form.useForm()
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        fetchSettings()
    }, [fetchSettings])

    useEffect(() => {
        if (isLoaded) {
            form.setFieldsValue({
                costing_method: settings.costing_method || 'WEIGHTED_AVERAGE',
                tax_rate: settings.tax_rate || '0',
                currency: settings.currency || 'PHP',
                business_name: settings.business_name || '',
            })
        }
    }, [isLoaded, settings, form])

    const handleSave = async (values) => {
        setSaving(true)
        try {
            const updates = Object.entries(values).map(([key, value]) =>
                updateSetting(key, String(value))
            )
            await Promise.all(updates)
            message.success('Settings saved successfully')
        } catch {
            message.error('Failed to save settings')
        } finally {
            setSaving(false)
        }
    }

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Settings</h1>
                    <p className="page-subtitle">System configuration and preferences</p>
                </div>
            </div>

            <Row gutter={[24, 24]}>
                <Tabs
                    defaultActiveKey="system"
                    items={[
                        {
                            key: 'system',
                            label: <><SettingOutlined style={{ marginRight: 8 }} />System Settings</>,
                            children: (
                                <Card style={{ borderRadius: 12, border: '1px solid var(--border)' }}>
                                    <Form form={form} layout="vertical" onFinish={handleSave}>
                                        <Form.Item
                                            name="business_name"
                                            label="Business Name"
                                            help="Displayed in header and reports"
                                        >
                                            <Input placeholder="My Bakery POS" />
                                        </Form.Item>

                                        <Divider />

                                        <Form.Item
                                            name="costing_method"
                                            label="Inventory Costing Method"
                                            help="Determines how unit cost is calculated when recording a sale"
                                        >
                                            <Select>
                                                <Select.Option value="WEIGHTED_AVERAGE">
                                                    Weighted Average — averages historical purchase costs
                                                </Select.Option>
                                                <Select.Option value="LATEST_PURCHASE">
                                                    Latest Purchase — uses most recent price
                                                </Select.Option>
                                                <Select.Option value="MANUAL_OVERRIDE">
                                                    Manual Override — uses manually set cost
                                                </Select.Option>
                                            </Select>
                                        </Form.Item>

                                        <Row gutter={16}>
                                            <Col span={12}>
                                                <Form.Item name="currency" label="Currency Symbol">
                                                    <Select>
                                                        <Select.Option value="PHP">PHP (₱)</Select.Option>
                                                        <Select.Option value="USD">USD ($)</Select.Option>
                                                        <Select.Option value="EUR">EUR (€)</Select.Option>
                                                    </Select>
                                                </Form.Item>
                                            </Col>
                                            <Col span={12}>
                                                <Form.Item name="tax_rate" label="Tax Rate (%)" help="0 = no tax">
                                                    <Input type="number" min={0} max={100} step="0.01" />
                                                </Form.Item>
                                            </Col>
                                        </Row>

                                        <Button
                                            type="primary"
                                            htmlType="submit"
                                            icon={<SaveOutlined />}
                                            loading={saving}
                                            size="large"
                                        >
                                            Save Settings
                                        </Button>
                                    </Form>
                                </Card>
                            )
                        },
                        {
                            key: 'users',
                            label: 'User Management',
                            disabled: true, // Placeholder for Phase 2
                        }
                    ]}
                />

                <Col xs={24} lg={10}>
                    <Card title="Costing Method Guide" style={{ borderRadius: 12, border: '1px solid var(--border)', marginTop: 48 }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            <div style={{ padding: '12px 16px', background: '#fdf6f5', borderRadius: 8, borderLeft: '4px solid var(--primary)' }}>
                                <Text strong>Weighted Average</Text>
                                <Text type="secondary" style={{ display: 'block', marginTop: 4, fontSize: 13 }}>
                                    Best for items with fluctuating prices. Averages historical purchase costs weighted by quantity.
                                </Text>
                            </div>
                            <div style={{ padding: '12px 16px', background: '#eff5ed', borderRadius: 8, borderLeft: '4px solid var(--success)' }}>
                                <Text strong>Latest Purchase</Text>
                                <Text type="secondary" style={{ display: 'block', marginTop: 4, fontSize: 13 }}>
                                    Uses the most recently recorded purchase price. Useful when prices are stable or you want to reflect current market rates.
                                </Text>
                            </div>
                            <div style={{ padding: '12px 16px', background: '#fcf8ee', borderRadius: 8, borderLeft: '4px solid var(--warning)' }}>
                                <Text strong>Manual Override</Text>
                                <Text type="secondary" style={{ display: 'block', marginTop: 4, fontSize: 13 }}>
                                    Uses a manually specified cost per material. Requires setting manual_unit_cost on each material. Good for fixed-cost contracts.
                                </Text>
                            </div>
                        </div>
                    </Card>

                    <Card title="Current Active Settings" style={{ borderRadius: 12, border: '1px solid var(--border)', marginTop: 24, background: 'var(--card-bg)' }}>
                        {Object.entries(settings).map(([k, v]) => (
                            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px dashed var(--border)' }}>
                                <Text type="secondary" style={{ fontSize: 13 }}>{k}</Text>
                                <Text strong style={{ fontSize: 13 }}>{v}</Text>
                            </div>
                        ))}
                    </Card>
                </Col>
            </Row>
        </div>
    )
}

export default Settings
