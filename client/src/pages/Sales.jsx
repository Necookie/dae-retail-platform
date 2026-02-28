// src/pages/Sales.jsx
import { useState, useEffect, useCallback } from 'react'
import {
    Table, Button, Form, Select, InputNumber, Input, Card, Tag,
    Typography, Space, Row, Col, Divider, message, DatePicker, Drawer,
} from 'antd'
import { ShoppingCartOutlined, PlusOutlined } from '@ant-design/icons'
import api from '../api/axios'
import dayjs from 'dayjs'

const { Text, Title } = Typography
const { RangePicker } = DatePicker
const { Option } = Select

const paymentColors = { UNPAID: 'var(--danger)', PARTIAL: 'var(--warning)', PAID: 'var(--success)', REFUNDED: 'var(--text-secondary)' }

const Sales = () => {
    const [sales, setSales] = useState([])
    const [products, setProducts] = useState([])
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [costPreview, setCostPreview] = useState(null)
    const [dateRange, setDateRange] = useState([])
    const [drawerOpen, setDrawerOpen] = useState(false)
    const [form] = Form.useForm()

    const fetchSales = useCallback(async (start, end) => {
        setLoading(true)
        try {
            const params = {}
            if (start) params.startDate = start
            if (end) params.endDate = end
            const { data } = await api.get('/sales', { params })
            setSales(data.data)
        } catch {
            message.error('Failed to load sales')
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        api.get('/products').then(({ data }) => setProducts(data.data)).catch(() => { })
        fetchSales()
    }, [fetchSales])

    const handleProductChange = async (productId) => {
        if (!productId) { setCostPreview(null); return }
        try {
            const { data } = await api.get(`/products/${productId}/cost`)
            setCostPreview(data.data)
        } catch {
            setCostPreview(null)
        }
    }

    const handleSale = async (values) => {
        setSubmitting(true)
        try {
            const { data } = await api.post('/sales', values)
            message.success(`Sale recorded! Profit: ₱${parseFloat(data.data.profit).toFixed(2)}`)
            form.resetFields()
            setCostPreview(null)
            setDrawerOpen(false)
            fetchSales()
        } catch (err) {
            message.error(err.response?.data?.error?.message || 'Failed to record sale')
        } finally {
            setSubmitting(false)
        }
    }

    const handleDateChange = (dates) => {
        setDateRange(dates || [])
        if (dates?.length === 2) {
            fetchSales(dates[0].format('YYYY-MM-DD'), dates[1].format('YYYY-MM-DD'))
        } else {
            fetchSales()
        }
    }

    const columns = [
        {
            title: 'Arrangement',
            dataIndex: ['product', 'name'],
            key: 'product',
            render: (name, r) => (
                <div>
                    <Text strong>{name}</Text>
                    {r.product?.sku && <Text type="secondary" style={{ display: 'block', fontSize: 12 }}>{r.product.sku}</Text>}
                </div>
            ),
        },
        { title: 'Qty', dataIndex: 'quantity', key: 'qty', width: 60 },
        {
            title: 'Unit Price',
            dataIndex: 'unitPrice',
            render: (v) => `₱${parseFloat(v).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`,
        },
        {
            title: 'Revenue',
            dataIndex: 'totalRevenue',
            render: (v) => `₱${parseFloat(v).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`,
        },
        {
            title: 'Prod. Cost',
            dataIndex: 'productionCostSnapshot',
            render: (v) => `₱${parseFloat(v).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`,
        },
        {
            title: 'Profit',
            dataIndex: 'profit',
            render: (v) => (
                <Text strong style={{ color: parseFloat(v) >= 0 ? '#10b981' : '#ef4444' }}>
                    ₱{parseFloat(v).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                </Text>
            ),
        },
        {
            title: 'Payment',
            dataIndex: 'paymentStatus',
            render: (s) => <Tag color={paymentColors[s]}>{s}</Tag>,
        },
        {
            title: 'Sold By',
            dataIndex: ['soldBy', 'name'],
            render: (v) => v || '—',
        },
        {
            title: 'Date',
            dataIndex: 'saleDate',
            render: (d) => dayjs(d).format('MMM D, YYYY h:mm A'),
        },
    ]

    const sellingPrice = products.find((p) => p.id === form.getFieldValue('productId'))?.sellingPrice
    const qty = form.getFieldValue('quantity') || 1
    const estimatedRevenue = sellingPrice ? parseFloat(sellingPrice) * qty : null
    const estimatedProfit = costPreview ? estimatedRevenue - (costPreview.totalCost * qty) : null

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1 className="page-title">POS / Sales</h1>
                    <p className="page-subtitle">Process new arrangements and track income</p>
                </div>
            </div>

            <Row gutter={24}>
                {/* Left Column: Catalog / History */}
                <Col span={14}>
                    <Card title="Sales History" bordered={false} style={{ borderRadius: 12, border: '1px solid var(--border)' }} extra={
                        <RangePicker onChange={handleDateChange} style={{ borderRadius: 8 }} />
                    }>
                        <Table
                            dataSource={sales}
                            columns={columns}
                            rowKey="id"
                            loading={loading}
                            pagination={{ pageSize: 10, showSizeChanger: true }}
                            size="small"
                            scroll={{ x: 'max-content' }}
                        />
                    </Card>
                </Col>

                {/* Right Column: POS Cart */}
                <Col span={10}>
                    <Card title={<><ShoppingCartOutlined style={{ marginRight: 8 }} />New Sale</>} bordered={false} style={{ borderRadius: 12, border: '1px solid var(--border)', background: 'var(--card-bg)' }}>
                        <Form form={form} layout="vertical" onFinish={handleSale} onValuesChange={() => {
                            handleProductChange(form.getFieldValue('productId'))
                        }}>
                            <Form.Item name="productId" label="Arrangement" rules={[{ required: true }]}>
                                <Select placeholder="Select an arrangement" showSearch optionFilterProp="children" onChange={handleProductChange} size="large">
                                    {products.map((p) => (
                                        <Option key={p.id} value={p.id}>
                                            {p.name} {p.sku ? `(${p.sku})` : ''} — ₱{parseFloat(p.sellingPrice).toFixed(2)}
                                        </Option>
                                    ))}
                                </Select>
                            </Form.Item>

                            <Row gutter={16}>
                                <Col span={12}>
                                    <Form.Item name="quantity" label="Quantity" initialValue={1} rules={[{ required: true }]}>
                                        <InputNumber min={1} style={{ width: '100%' }} size="large" />
                                    </Form.Item>
                                </Col>
                                <Col span={12}>
                                    <Form.Item name="paymentStatus" label="Payment Status" initialValue="UNPAID">
                                        <Select size="large">
                                            <Option value="UNPAID">Unpaid</Option>
                                            <Option value="PARTIAL">Partial</Option>
                                            <Option value="PAID">Paid</Option>
                                        </Select>
                                    </Form.Item>
                                </Col>
                            </Row>

                            <Form.Item name="notes" label="Notes">
                                <Input.TextArea rows={2} placeholder="Customer or order notes" />
                            </Form.Item>

                            {costPreview && (
                                <Card size="small" style={{ marginBottom: 24, background: '#f9fafb', borderRadius: 12, border: '1px solid var(--border)' }}>
                                    <Text type="secondary" style={{ fontSize: 12, letterSpacing: '0.5px' }}>BUILD COST PREVIEW</Text>
                                    <div style={{ marginTop: 8 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 6 }}>
                                            <Text>Base Build Cost:</Text>
                                            <Text>₱{(costPreview.totalCost * qty).toFixed(2)}</Text>
                                        </div>
                                        {estimatedRevenue && (
                                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <Text>Revenue:</Text>
                                                <Text>₱{estimatedRevenue.toFixed(2)}</Text>
                                            </div>
                                        )}
                                        {estimatedProfit !== null && (
                                            <Divider style={{ margin: '8px 0', borderColor: 'var(--border)' }} />
                                        )}
                                        {estimatedProfit !== null && (
                                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <Text strong>Est. Profit:</Text>
                                                <Text strong style={{ color: estimatedProfit >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                                                    ₱{estimatedProfit.toFixed(2)}
                                                </Text>
                                            </div>
                                        )}
                                    </div>
                                </Card>
                            )}

                            <Button type="primary" htmlType="submit" block size="large" loading={submitting} icon={<ShoppingCartOutlined />} style={{ height: 48, fontSize: 16 }}>
                                Record Sale
                                {estimatedRevenue && ` (₱${estimatedRevenue.toFixed(2)})`}
                            </Button>
                        </Form>
                    </Card>
                </Col>
            </Row>
        </div>
    )
}

export default Sales
