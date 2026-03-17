// src/pages/Products.jsx
import { useState, useEffect, useCallback } from 'react'
import {
    Table, Button, Modal, Drawer, Form, Input, InputNumber, Tag, Space, Select,
    Typography, message, Tooltip, Divider, Empty, Row, Col
} from 'antd'
import { PlusOutlined, EditOutlined, FileSearchOutlined, DeleteOutlined, SyncOutlined } from '@ant-design/icons'
import api from '../api/axios'

const { Text } = Typography
const { Option } = Select

const statusColors = {
    PENDING: 'default', IN_PRODUCTION: 'processing', COMPLETED: 'success', CANCELLED: 'error',
}
const paymentColors = {
    UNPAID: 'error', PARTIAL: 'warning', PAID: 'success', REFUNDED: 'default',
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
                    variantId: m.variantId,
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

    const openStatusModal = (item) => {
        setStatusModal({ open: true, item })
        statusForm.setFieldsValue({
            productionStatus: item.productionStatus,
            paymentStatus: item.paymentStatus,
        })
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
                const totalCost = r.productMaterials?.reduce((sum, m) => sum + (m.quantityRequired * (m.variant?.latestUnitCost || 0)), 0) || 0;
                return <Text>₱{totalCost.toFixed(2)}</Text>;
            }
        },
        {
            title: 'Selling Price',
            dataIndex: 'sellingPrice',
            render: (v) => <Text strong>₱{parseFloat(v).toLocaleString('en-PH', { minimumFractionDigits: 2 })}</Text>,
        },
        {
            title: 'Production',
            dataIndex: 'productionStatus',
            render: (status) => <Tag color={statusColors[status]}>{status}</Tag>,
        },
        {
            title: 'Payment',
            dataIndex: 'paymentStatus',
            render: (status) => <Tag color={paymentColors[status]}>{status}</Tag>,
        },
        {
            title: 'Margin',
            key: 'margin',
            render: (_, r) => {
                const totalCost = r.productMaterials?.reduce((sum, m) => sum + (m.quantityRequired * (m.variant?.latestUnitCost || 0)), 0) || 0;
                const sellingPrice = parseFloat(r.sellingPrice) || 0;
                const profit = sellingPrice - totalCost;
                const margin = sellingPrice > 0 ? (profit / sellingPrice) * 100 : 0;
                return (
                    <div>
                        <Text style={{ color: profit >= 0 ? 'var(--success)' : 'var(--danger)', fontWeight: 600 }}>₱{profit.toFixed(2)}</Text>
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
                    <Tooltip title="Update Status"><Button size="small" icon={<SyncOutlined />} onClick={() => openStatusModal(r)} /></Tooltip>
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
                            <Input placeholder="BOUQ-001" />
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
                                    <Space key={key} align="start" style={{ display: 'flex', marginBottom: 8, flexWrap: 'wrap' }} size={8}>
                                        <div style={{ flex: 2, minWidth: 200 }}>
                                            <Form.Item {...rest} name={[name, 'materialId']} rules={[{ required: true, message: 'Select material' }]} style={{ margin: 0, marginBottom: 4 }}>
                                                <Select
                                                    placeholder="Select material"
                                                    onChange={() => {
                                                        const currentMaterials = form.getFieldValue('materials');
                                                        currentMaterials[name].variantId = undefined;
                                                        form.setFieldsValue({ materials: currentMaterials });
                                                    }}
                                                >
                                                    {materials.map((m) => (
                                                        <Option key={m.id} value={m.id}>{m.name}</Option>
                                                    ))}
                                                </Select>
                                            </Form.Item>

                                            <Form.Item
                                                shouldUpdate={(prevValues, currentValues) =>
                                                    prevValues.materials?.[name]?.materialId !== currentValues.materials?.[name]?.materialId
                                                }
                                                style={{ margin: 0 }}
                                            >
                                                {({ getFieldValue }) => {
                                                    const selectedMaterialId = getFieldValue(['materials', name, 'materialId']);
                                                    const selectedMaterial = materials.find(m => m.id === selectedMaterialId);

                                                    return (
                                                        <Form.Item {...rest} name={[name, 'variantId']} rules={[{ required: true, message: 'Select variant' }]} style={{ margin: 0 }}>
                                                            <Select placeholder="Select variant" disabled={!selectedMaterialId}>
                                                                {selectedMaterial?.variants?.map(v => (
                                                                    <Option key={v.id} value={v.id}>{v.name} ({selectedMaterial.unit})</Option>
                                                                ))}
                                                            </Select>
                                                        </Form.Item>
                                                    );
                                                }}
                                            </Form.Item>
                                        </div>
                                        <Form.Item {...rest} name={[name, 'quantityRequired']} rules={[{ required: true, message: 'Qty required' }]} style={{ flex: 1, margin: 0, minWidth: 100 }}>
                                            <InputNumber min={0.0001} step={0.01} placeholder="Qty" style={{ width: '100%' }} />
                                        </Form.Item>
                                        <Button danger size="small" type="text" icon={<DeleteOutlined />} onClick={() => remove(name)} style={{ color: 'var(--danger)', marginTop: 4 }} />
                                    </Space>
                                ))}
                                <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />} style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)', marginTop: 8 }}>
                                    Add Component
                                </Button>
                            </>
                        )}
                    </Form.List>
                </Form>
            </Modal>

            {/* View Build Drawer */}
            <Drawer
                title={<Typography.Title level={4} style={{ margin: 0 }}>Atelier Spec Sheet</Typography.Title>}
                placement="right"
                width={500}
                onClose={() => setCostModal({ open: false, data: null, loading: false })}
                open={costModal.open}
            >
                {costModal.loading ? (
                    <div style={{ textAlign: 'center', padding: 80 }}><Text type="secondary">Loading components...</Text></div>
                ) : costModal.data ? (
                    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                        <div style={{ flex: 1, padding: '0 8px' }}>
                            <Text type="secondary" style={{ display: 'block', marginBottom: 24, fontSize: 13, letterSpacing: '0.05em' }}>
                                COMPONENTS REQUIREMENT
                            </Text>
                            {costModal.data.breakdown.map((item, i) => (
                                <Row key={i} style={{ marginBottom: 16, paddingBottom: 16, borderBottom: '1px solid var(--border)' }}>
                                    <Col span={16}>
                                        <Text strong style={{ fontSize: 15 }}>{item.materialName} - {item.variantName}</Text>
                                        <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
                                            {item.quantityUsed} {item.unit} @ ₱{(item.lineCost / item.quantityUsed).toFixed(2)}
                                        </div>
                                    </Col>
                                    <Col span={8} style={{ textAlign: 'right', display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                                        <Text strong style={{ color: 'var(--text-primary)', fontSize: 15 }}>₱{item.lineCost.toFixed(2)}</Text>
                                    </Col>
                                </Row>
                            ))}
                        </div>

                        <div className="receipt-card" style={{ padding: 24, margin: '24px 8px 8px 8px' }}>
                            <Text strong style={{ fontSize: 16, display: 'block', marginBottom: 16, borderBottom: '2px solid var(--text-primary)', paddingBottom: 8 }}>
                                Financial Summary
                            </Text>
                            <Row style={{ marginBottom: 12 }}>
                                <Col span={16}><Text style={{ color: 'var(--text-secondary)' }}>Base Build Cost</Text></Col>
                                <Col span={8} style={{ textAlign: 'right' }}><Text strong>₱{costModal.data.totalCost.toFixed(2)}</Text></Col>
                            </Row>
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

            <Modal
                title={statusModal.item ? `Update Status: ${statusModal.item.name}` : 'Update Status'}
                open={statusModal.open}
                onCancel={() => setStatusModal({ open: false, item: null })}
                onOk={() => statusForm.submit()}
                destroyOnClose
            >
                <Form form={statusForm} layout="vertical" onFinish={handleStatusUpdate} style={{ marginTop: 16 }}>
                    <Form.Item name="productionStatus" label="Production Status">
                        <Select
                            options={[
                                { value: 'PENDING', label: 'PENDING' },
                                { value: 'IN_PRODUCTION', label: 'IN_PRODUCTION' },
                                { value: 'COMPLETED', label: 'COMPLETED' },
                                { value: 'CANCELLED', label: 'CANCELLED' },
                            ]}
                        />
                    </Form.Item>
                    <Form.Item name="paymentStatus" label="Payment Status">
                        <Select
                            options={[
                                { value: 'UNPAID', label: 'UNPAID' },
                                { value: 'PARTIAL', label: 'PARTIAL' },
                                { value: 'PAID', label: 'PAID' },
                                { value: 'REFUNDED', label: 'REFUNDED' },
                            ]}
                        />
                    </Form.Item>
                </Form>
            </Modal>


        </div>
    )
}

export default Products
