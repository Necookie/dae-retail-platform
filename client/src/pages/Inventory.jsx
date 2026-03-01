// src/pages/Inventory.jsx
import { useState, useEffect, useCallback } from 'react'
import {
    Table, Button, Modal, Form, Input, InputNumber, Drawer, Tag, Space,
    Typography, Popconfirm, message, Badge, Tooltip, Select, Row, Col,
} from 'antd'
import { PlusOutlined, EditOutlined, ShoppingOutlined, HistoryOutlined, DeleteOutlined } from '@ant-design/icons'
import api from '../api/axios'
import dayjs from 'dayjs'

const { Text } = Typography

const Inventory = () => {
    const [materials, setMaterials] = useState([])
    const [loading, setLoading] = useState(true)
    const [materialModal, setMaterialModal] = useState({ open: false, item: null })
    const [purchaseDrawer, setPurchaseDrawer] = useState({ open: false, material: null })
    const [purchases, setPurchases] = useState([])
    const [purchasesLoading, setPurchasesLoading] = useState(false)
    const [form] = Form.useForm()
    const [purchaseForm] = Form.useForm()

    const fetchMaterials = useCallback(async () => {
        setLoading(true)
        try {
            const { data } = await api.get('/materials')
            setMaterials(data.data)
        } catch {
            message.error('Failed to load inventory')
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => { fetchMaterials() }, [fetchMaterials])

    const openMaterialModal = (item = null) => {
        setMaterialModal({ open: true, item })
        if (item) form.setFieldsValue(item)
        else form.resetFields()
    }

    const openPurchaseDrawer = async (material) => {
        setPurchaseDrawer({ open: true, material })
        setPurchasesLoading(true)
        try {
            const { data } = await api.get(`/materials/${material.id}/purchases`)
            setPurchases(data.data)
        } catch {
            message.error('Failed to load purchases')
        } finally {
            setPurchasesLoading(false)
        }
        purchaseForm.resetFields()
    }

    const handleSaveMaterial = async (values) => {
        try {
            if (materialModal.item) {
                await api.put(`/materials/${materialModal.item.id}`, values)
                message.success('Material updated')
            } else {
                await api.post('/materials', values)
                message.success('Material created')
            }
            setMaterialModal({ open: false, item: null })
            fetchMaterials()
        } catch (err) {
            message.error(err.response?.data?.error?.message || 'Failed to save')
        }
    }

    const handlePurchase = async (values) => {
        try {
            await api.post(`/materials/${purchaseDrawer.material.id}/purchases`, values)
            message.success('Purchase recorded & stock updated')
            purchaseForm.resetFields()
            const { data } = await api.get(`/materials/${purchaseDrawer.material.id}/purchases`)
            setPurchases(data.data)
            fetchMaterials()
        } catch (err) {
            message.error(err.response?.data?.error?.message || 'Failed to record purchase')
        }
    }

    const handleDeleteMaterial = async (id) => {
        try {
            await api.delete(`/materials/${id}`)
            message.success('Material deleted')
            fetchMaterials()
        } catch (err) {
            message.error(err.response?.data?.error?.message || 'Failed to delete material')
        }
    }

    const columns = [
        {
            title: 'Raw Material',
            dataIndex: 'name',
            key: 'name',
            render: (name, r) => (
                <div>
                    <Text strong style={{ fontSize: 14 }}>{name}</Text>
                    {parseFloat(r.quantityOnHand) <= parseFloat(r.reorderLevel) && (
                        <Tag className="status-restock" style={{ marginLeft: 12 }}>NEEDS RESTOCK</Tag>
                    )}
                </div>
            ),
        },
        { title: 'Unit', dataIndex: 'unit', key: 'unit', width: 80 },
        {
            title: 'On Hand',
            dataIndex: 'quantityOnHand',
            key: 'qty',
            render: (v, r) => (
                <Text strong style={{ color: parseFloat(v) <= parseFloat(r.reorderLevel) ? '#ef4444' : '#111827' }}>
                    {parseFloat(v).toFixed(2)} {r.unit}
                </Text>
            ),
        },
        {
            title: 'Reorder Level',
            dataIndex: 'reorderLevel',
            key: 'reorder',
            render: (v, r) => `${parseFloat(v).toFixed(2)} ${r.unit}`,
        },
        {
            title: 'Unit Cost',
            key: 'costs',
            render: (_, r) => (
                <div>
                    <Text strong>Avg: ₱{parseFloat(r.weightedAvgCost).toFixed(4)}</Text>
                    <Text type="secondary" style={{ display: 'block', fontSize: 12, marginTop: 2 }}>Latest: ₱{parseFloat(r.latestUnitCost).toFixed(4)}</Text>
                </div>
            )
        },
        {
            title: 'Actions',
            key: 'actions',
            width: 160,
            render: (_, r) => (
                <Space>
                    <Tooltip title="Edit"><Button size="small" icon={<EditOutlined />} onClick={() => openMaterialModal(r)} /></Tooltip>
                    <Tooltip title="Record Purchase">
                        <Button size="small" type="primary" icon={<ShoppingOutlined />} onClick={() => openPurchaseDrawer(r)} />
                    </Tooltip>
                    <Tooltip title="Purchase History">
                        <Button size="small" icon={<HistoryOutlined />} onClick={() => openPurchaseDrawer(r)} />
                    </Tooltip>
                    <Tooltip title="Delete">
                        <Popconfirm title="Delete this material?" onConfirm={() => handleDeleteMaterial(r.id)}>
                            <Button size="small" danger icon={<DeleteOutlined />} />
                        </Popconfirm>
                    </Tooltip>
                </Space>
            ),
        },
    ]

    const purchaseColumns = [
        { title: 'Date', dataIndex: 'purchaseDate', render: (d) => dayjs(d).format('MMM D, YYYY') },
        { title: 'Qty', dataIndex: 'quantity', render: (v) => parseFloat(v).toFixed(2) },
        { title: 'Unit Cost', dataIndex: 'unitCost', render: (v) => `₱${parseFloat(v).toFixed(4)}` },
        { title: 'Total', dataIndex: 'totalCost', render: (v) => `₱${parseFloat(v).toFixed(2)}` },
        { title: 'Supplier', dataIndex: 'supplier', render: (v) => v || '—' },
    ]

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Raw Materials</h1>
                    <p className="page-subtitle">Manage inventory levels and restock materials</p>
                </div>
                <Button type="primary" icon={<PlusOutlined />} onClick={() => openMaterialModal()}>
                    Add Material
                </Button>
            </div>

            <Table
                dataSource={materials}
                columns={columns}
                rowKey="id"
                loading={loading}
                rowClassName={(r) => parseFloat(r.quantityOnHand) <= parseFloat(r.reorderLevel) ? 'low-stock-row' : ''}
                pagination={{ pageSize: 20, showSizeChanger: true }}
                style={{ background: 'white', borderRadius: 12 }}
                scroll={{ x: 800 }}
            />

            {/* Material Modal */}
            <Modal
                title={materialModal.item ? 'Edit Material' : 'Add Material'}
                open={materialModal.open}
                onCancel={() => setMaterialModal({ open: false, item: null })}
                onOk={() => form.submit()}
                destroyOnClose
            >
                <Form form={form} layout="vertical" onFinish={handleSaveMaterial} style={{ marginTop: 16 }}>
                    <Form.Item name="name" label="Material Name" rules={[{ required: true }]}>
                        <Input placeholder="e.g. Premium Leather Hide" />
                    </Form.Item>
                    <Form.Item name="unit" label="Unit" rules={[{ required: true }]}>
                        <Select placeholder="Select unit">
                            <Select.Option value="pc">pc</Select.Option>
                            <Select.Option value="roll">roll</Select.Option>
                            <Select.Option value="meter">meter</Select.Option>
                            <Select.Option value="pack">pack</Select.Option>
                            <Select.Option value="box">box</Select.Option>
                        </Select>
                    </Form.Item>
                    <Form.Item name="reorderLevel" label="Reorder Level">
                        <InputNumber min={0} step={0.01} style={{ width: '100%' }} />
                    </Form.Item>
                    <Form.Item name="manualUnitCost" label="Manual Cost Override (optional)">
                        <InputNumber min={0} step={0.0001} style={{ width: '100%' }} prefix="₱" />
                    </Form.Item>
                </Form>
            </Modal>

            <Drawer
                title={<Typography.Title level={4} style={{ margin: 0 }}>Restock & History — {purchaseDrawer.material?.name}</Typography.Title>}
                open={purchaseDrawer.open}
                onClose={() => setPurchaseDrawer({ open: false, material: null })}
                width={600}
            >
                <div style={{ background: 'var(--content-bg)', padding: 20, borderRadius: 12, border: '1px solid var(--border)', marginBottom: 32 }}>
                    <Text strong style={{ fontSize: 15, display: 'block', marginBottom: 16 }}>Record New Intakes</Text>
                    <Form form={purchaseForm} layout="vertical" onFinish={handlePurchase}>
                        <Row gutter={16}>
                            <Col span={12}>
                                <Form.Item name="quantity" label="Quantity" rules={[{ required: true }]}>
                                    <InputNumber min={0.0001} step={0.01} style={{ width: '100%' }} />
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item name="unitCost" label="Unit Cost (₱)" rules={[{ required: true }]}>
                                    <InputNumber min={0} step={0.0001} style={{ width: '100%' }} prefix="₱" />
                                </Form.Item>
                            </Col>
                        </Row>
                        <Form.Item name="supplier" label="Supplier">
                            <Input placeholder="Supplier name (optional)" />
                        </Form.Item>
                        <Form.Item name="notes" label="Notes" style={{ marginBottom: 24 }}>
                            <Input.TextArea rows={2} />
                        </Form.Item>
                        <Button type="primary" size="large" htmlType="submit" block icon={<ShoppingOutlined />}>
                            Record Purchase & Update Stock
                        </Button>
                    </Form>
                </div>

                <div>
                    <Text strong style={{ fontSize: 15, display: 'block', marginBottom: 12 }}>Purchase Ledger</Text>
                    <Table
                        dataSource={purchases}
                        columns={purchaseColumns}
                        rowKey="id"
                        loading={purchasesLoading}
                        size="small"
                        style={{ marginTop: 12 }}
                        pagination={{ pageSize: 10 }}
                    />
                </div>
            </Drawer>
        </div>
    )
}

export default Inventory
