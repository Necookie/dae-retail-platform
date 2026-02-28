// src/pages/Products.jsx
import { useState, useEffect, useCallback } from 'react'
import {
    Table, Button, Modal, Drawer, Form, Input, InputNumber, Tag, Space, Select,
    Typography, message, Tooltip, Divider, Empty, Row, Col
} from 'antd'
import { PlusOutlined, EditOutlined, FileSearchOutlined, DeleteOutlined } from '@ant-design/icons'
import api from '../api/axios'

const { Text } = Typography
const { Option } = Select

const statusColors = {
    PENDING: 'var(--text-secondary)', IN_PRODUCTION: 'var(--danger)', COMPLETED: 'var(--success)', CANCELLED: 'var(--danger)',
}
const paymentColors = {
    UNPAID: 'var(--danger)', PARTIAL: 'var(--warning)', PAID: 'var(--success)', REFUNDED: 'var(--text-secondary)',
}

const Products = () => {
    const [products, setProducts] = useState([])
    const [materials, setMaterials] = useState([])
    const [loading, setLoading] = useState(true)
    const [modal, setModal] = useState({ open: false, item: null })
    const [costModal, setCostModal] = useState({ open: false, data: null, loading: false })
    const [statusModal, setStatusModal] = useState({ open: false, item: null })
    const [form] = Form.useForm()
    const [statusForm] = Form.useForm()

    const fetchAll = useCallback(async () => {
        setLoading(true)
        try {
            const [pRes, mRes] = await Promise.all([api.get('/products'), api.get('/materials')])
            setProducts(pRes.data.data)
            setMaterials(mRes.data.data)
        } catch {
            message.error('Failed to load data')
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => { fetchAll() }, [fetchAll])

    const openModal = (item = null) => {
        setModal({ open: true, item })
        if (item) {
            form.setFieldsValue({
                name: item.name, sku: item.sku, description: item.description,
                sellingPrice: parseFloat(item.sellingPrice),
                materials: item.productMaterials?.map((m) => ({
                    materialId: m.materialId,
                    quantityRequired: parseFloat(m.quantityRequired),
                })) || [],
            })
        } else {
            form.resetFields()
        }
    }

    const handleSave = async (values) => {
        try {
            if (modal.item) {
                await api.put(`/products/${modal.item.id}`, values)
                message.success('Product updated')
            } else {
                await api.post('/products', values)
                message.success('Product created')
            }
            setModal({ open: false, item: null })
            fetchAll()
        } catch (err) {
            message.error(err.response?.data?.error?.message || 'Failed to save product')
        }
    }

    const viewCost = async (id) => {
        setCostModal({ open: true, data: null, loading: true })
        try {
            const { data } = await api.get(`/products/${id}/cost`)
            setCostModal({ open: true, data: data.data, loading: false })
        } catch {
            message.error('Failed to fetch cost')
            setCostModal({ open: false, data: null, loading: false })
        }
    }

    const handleStatusUpdate = async (values) => {
        try {
            await api.patch(`/products/${statusModal.item.id}/status`, values)
            message.success('Status updated')
            setStatusModal({ open: false, item: null })
            fetchAll()
        } catch (err) {
            message.error(err.response?.data?.error?.message || 'Failed to update status')
        }
    }

    const columns = [
        {
            title: 'Arrangement',
            dataIndex: 'name',
            key: 'name',
            render: (name, r) => (
                <div>
                    <Text strong style={{ fontSize: 15 }}>{name}</Text>
                    {r.sku && <Text type="secondary" style={{ display: 'block', fontSize: 12, marginTop: 2 }}>{r.sku}</Text>}
                </div>
            ),
        },
        {
            title: 'Components',
            dataIndex: 'productMaterials',
            render: (bom) => <Text type="secondary">{bom?.length || 0} items</Text>,
        },
        {
            title: 'Base Cost',
            key: 'baseCost',
            render: (_, r) => {
                const totalCost = r.productMaterials?.reduce((sum, m) => sum + (m.quantityRequired * (m.material?.latestUnitCost || 0)), 0) || 0;
                return <Text>₱{totalCost.toFixed(2)}</Text>;
            }
        },
        {
            title: 'Selling Price',
            dataIndex: 'sellingPrice',
            render: (v) => <Text strong>₱{parseFloat(v).toLocaleString('en-PH', { minimumFractionDigits: 2 })}</Text>,
        },
        {
            title: 'Margin',
            key: 'margin',
            render: (_, r) => {
                const totalCost = r.productMaterials?.reduce((sum, m) => sum + (m.quantityRequired * (m.material?.latestUnitCost || 0)), 0) || 0;
                const sellingPrice = parseFloat(r.sellingPrice) || 0;
                const profit = sellingPrice - totalCost;
                const margin = sellingPrice > 0 ? (profit / sellingPrice) * 100 : 0;
                return (
                    <div>
                        <Text type="success">₱{profit.toFixed(2)}</Text>
                        <Text type="secondary" style={{ display: 'block', fontSize: 12 }}>{margin.toFixed(1)}%</Text>
                    </div>
                );
            }
        },
        {
            title: 'Actions',
            key: 'actions',
            width: 150,
            render: (_, r) => (
                <Space>
                    <Tooltip title="View Build"><Button size="small" type="primary" icon={<FileSearchOutlined />} onClick={() => viewCost(r.id)} /></Tooltip>
                    <Tooltip title="Edit Arrangement"><Button size="small" icon={<EditOutlined />} onClick={() => openModal(r)} /></Tooltip>
                </Space>
            ),
        },
    ]

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Arrangements</h1>
                    <p className="page-subtitle">Manage premium fuzzywire arrangements and build components</p>
                </div>
                <Button type="primary" icon={<PlusOutlined />} onClick={() => openModal()}>Add Arrangement</Button>
            </div>

            <Table
                dataSource={products}
                columns={columns}
                rowKey="id"
                loading={loading}
                pagination={{ pageSize: 20 }}
                style={{ background: 'white', borderRadius: 12 }}
                scroll={{ x: 800 }}
            />

            {/* Product Modal */}
            <Modal
                title={modal.item ? 'Edit Arrangement' : 'Add Arrangement'}
                open={modal.open}
                onCancel={() => setModal({ open: false, item: null })}
                onOk={() => form.submit()}
                width={620}
                destroyOnClose
            >
                <Form form={form} layout="vertical" onFinish={handleSave} style={{ marginTop: 16 }}>
                    <Form.Item name="name" label="Arrangement Name" rules={[{ required: true }]}>
                        <Input placeholder="e.g. Classic Red Rose Bouquet" />
                    </Form.Item>
                    <Space style={{ width: '100%' }} size={12}>
                        <Form.Item name="sku" label="SKU" style={{ flex: 1 }}>
                            <Input placeholder="CAKE-001" />
                        </Form.Item>
                        <Form.Item name="sellingPrice" label="Selling Price (₱)" rules={[{ required: true }]} style={{ flex: 1 }}>
                            <InputNumber min={0} step={0.01} style={{ width: '100%' }} prefix="₱" />
                        </Form.Item>
                    </Space>
                    <Form.Item name="description" label="Description">
                        <Input.TextArea rows={2} />
                    </Form.Item>
                    <Divider orientation="left" style={{ fontSize: 13, borderColor: 'var(--border)' }}>Build Components</Divider>
                    <Form.List name="materials">
                        {(fields, { add, remove }) => (
                            <>
                                {fields.map(({ key, name, ...rest }) => (
                                    <Space key={key} align="baseline" style={{ display: 'flex', marginBottom: 8 }} size={8}>
                                        <Form.Item {...rest} name={[name, 'materialId']} rules={[{ required: true, message: 'Select material' }]} style={{ flex: 2, margin: 0 }}>
                                            <Select placeholder="Select material" style={{ minWidth: 200 }}>
                                                {materials.map((m) => (
                                                    <Option key={m.id} value={m.id}>{m.name} ({m.unit})</Option>
                                                ))}
                                            </Select>
                                        </Form.Item>
                                        <Form.Item {...rest} name={[name, 'quantityRequired']} rules={[{ required: true, message: 'Qty required' }]} style={{ flex: 1, margin: 0 }}>
                                            <InputNumber min={0.0001} step={0.01} placeholder="Qty" style={{ width: 100 }} />
                                        </Form.Item>
                                        <Button danger size="small" type="text" icon={<DeleteOutlined />} onClick={() => remove(name)} style={{ color: 'var(--danger)' }} />
                                    </Space>
                                ))}
                                <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />} style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
                                    Add Component
                                </Button>
                            </>
                        )}
                    </Form.List>
                </Form>
            </Modal>

            {/* View Build Drawer */}
            <Drawer
                title={<Text strong style={{ fontSize: 18 }}>Build Breakdown</Text>}
                placement="right"
                width={480}
                onClose={() => setCostModal({ open: false, data: null, loading: false })}
                open={costModal.open}
            >
                {costModal.loading ? (
                    <div style={{ textAlign: 'center', padding: 80 }}><Text type="secondary">Loading components...</Text></div>
                ) : costModal.data ? (
                    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                        <div style={{ flex: 1 }}>
                            <Text type="secondary" style={{ display: 'block', marginBottom: 16, fontSize: 13 }}>
                                COMPONENTS LIST
                            </Text>
                            {costModal.data.breakdown.map((item, i) => (
                                <Row key={i} style={{ marginBottom: 12, paddingBottom: 12, borderBottom: '1px solid var(--border)' }}>
                                    <Col span={16}>
                                        <Text strong>{item.materialName}</Text>
                                        <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                                            {item.quantityUsed} {item.unit} @ ₱{(item.lineCost / item.quantityUsed).toFixed(2)}
                                        </div>
                                    </Col>
                                    <Col span={8} style={{ textAlign: 'right' }}>
                                        <Text strong style={{ color: 'var(--text-primary)' }}>₱{item.lineCost.toFixed(2)}</Text>
                                    </Col>
                                </Row>
                            ))}
                        </div>

                        <div style={{ background: 'var(--content-bg)', padding: 20, borderRadius: 12, marginTop: 24 }}>
                            <Row style={{ marginBottom: 8 }}>
                                <Col span={16}><Text>Base Build Cost</Text></Col>
                                <Col span={8} style={{ textAlign: 'right' }}><Text strong>₱{costModal.data.totalCost.toFixed(2)}</Text></Col>
                            </Row>
                            <Divider style={{ margin: '12px 0', borderColor: 'var(--border)' }} />
                            <Row>
                                <Col span={16}><Text strong style={{ fontSize: 16 }}>Total Cost</Text></Col>
                                <Col span={8} style={{ textAlign: 'right' }}>
                                    <Text strong style={{ fontSize: 16, color: 'var(--primary)' }}>₱{costModal.data.totalCost.toFixed(2)}</Text>
                                </Col>
                            </Row>
                        </div>
                    </div>
                ) : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No components found" />}
            </Drawer>


        </div>
    )
}

export default Products
