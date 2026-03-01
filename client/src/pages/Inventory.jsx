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

    const openPurchaseDrawer = async (variant, baseMaterial) => {
        setPurchaseDrawer({ open: true, variant, material: baseMaterial })
        setPurchasesLoading(true)
        try {
            const { data } = await api.get(`/materials/${variant.id}/purchases`)
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
            await api.post(`/materials/${purchaseDrawer.material.id}/purchases`, { ...values, variantId: purchaseDrawer.variant.id })
            message.success('Purchase recorded & stock updated')
            purchaseForm.resetFields()
            const { data } = await api.get(`/materials/${purchaseDrawer.variant.id}/purchases`)
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
            sorter: (a, b) => a.name.localeCompare(b.name),
            render: (name, r) => (
                <div>
                    <Text strong style={{ fontSize: 14 }}>{name}</Text>
                    {r.variants?.some(v => parseFloat(v.quantityOnHand) <= parseFloat(v.reorderLevel)) && (
                        <Tag className="status-restock" style={{ marginLeft: 12 }}>VARIANT NEEDS RESTOCK</Tag>
                    )}
                </div>
            ),
        },
        {
            title: 'Category',
            dataIndex: 'category',
            key: 'category',
            width: 150,
            render: (v) => v ? <Tag>{v}</Tag> : <Text type="secondary">—</Text>,
            filters: [
                { text: 'Core Materials', value: 'Core Materials' },
                { text: 'Decor Elements', value: 'Decor Elements' },
                { text: 'Functional Parts', value: 'Functional Parts' },
                { text: 'Brand Packaging', value: 'Brand Packaging' },
                { text: 'Workshop Tools', value: 'Workshop Tools' },
            ],
            onFilter: (value, record) => record.category === value,
        },
        { title: 'Unit (Base)', dataIndex: 'unit', key: 'unit', width: 120 },
        {
            title: 'Total Variants',
            key: 'totalVariants',
            render: (_, r) => <Text>{r.variants?.length || 0} variants</Text>,
        },
        {
            title: 'Actions',
            key: 'actions',
            width: 100,
            render: (_, r) => (
                <Space>
                    <Tooltip title="Edit Base Material"><Button size="small" icon={<EditOutlined />} onClick={() => openMaterialModal(r)} /></Tooltip>
                    <Tooltip title="Delete Material">
                        <Popconfirm title="Delete this material and all its variants?" onConfirm={() => handleDeleteMaterial(r.id)}>
                            <Button size="small" danger icon={<DeleteOutlined />} />
                        </Popconfirm>
                    </Tooltip>
                </Space>
            ),
        },
    ]

    const expandedRowRender = (material) => {
        const variantColumns = [
            {
                title: 'Variant Name',
                dataIndex: 'name',
                key: 'name',
                render: (v) => <Text strong>{v}</Text>
            },
            { title: 'SKU', dataIndex: 'sku', key: 'sku', render: (v) => v || <Text type="secondary">—</Text> },
            {
                title: 'On Hand',
                dataIndex: 'quantityOnHand',
                key: 'qty',
                render: (v, r) => (
                    <Text strong style={{ color: parseFloat(v) <= parseFloat(r.reorderLevel) ? '#ef4444' : '#111827' }}>
                        {parseFloat(v).toFixed(2)} {material.unit}
                    </Text>
                ),
            },
            {
                title: 'Reorder Level',
                dataIndex: 'reorderLevel',
                key: 'reorder',
                render: (v) => `${parseFloat(v).toFixed(2)} ${material.unit}`
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
                width: 120,
                render: (_, r) => (
                    <Space>
                        <Tooltip title="Record Purchase for Variant">
                            <Button size="small" type="primary" icon={<ShoppingOutlined />} onClick={() => openPurchaseDrawer(r, material)} />
                        </Tooltip>
                        <Tooltip title="Purchase History">
                            <Button size="small" icon={<HistoryOutlined />} onClick={() => openPurchaseDrawer(r, material)} />
                        </Tooltip>
                    </Space>
                ),
            },
        ];
        return <Table columns={variantColumns} dataSource={material.variants || []} pagination={false} rowKey="id" size="small" style={{ margin: '8px 16px' }} />;
    };

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
                expandable={{ expandedRowRender }}
                rowKey="id"
                loading={loading}
                rowClassName={(r) => r.variants?.some(v => parseFloat(v.quantityOnHand) <= parseFloat(v.reorderLevel)) ? 'low-stock-row' : ''}
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
                    <Form.Item name="category" label="Category" rules={[{ required: true }]}>
                        <Select placeholder="Select category">
                            <Select.Option value="Core Materials">Core Materials</Select.Option>
                            <Select.Option value="Decor Elements">Decor Elements</Select.Option>
                            <Select.Option value="Functional Parts">Functional Parts</Select.Option>
                            <Select.Option value="Brand Packaging">Brand Packaging</Select.Option>
                            <Select.Option value="Workshop Tools">Workshop Tools</Select.Option>
                        </Select>
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

                    <Form.List name="variants" initialValue={[{ name: 'Standard' }]}>
                        {(fields, { add, remove }) => (
                            <div style={{ background: '#f8fafc', padding: 16, borderRadius: 8, marginTop: 16 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                                    <Text strong>Variants / Options (Colors, Sizes)</Text>
                                    <Button type="dashed" onClick={() => add()} icon={<PlusOutlined />} size="small">
                                        Add Variant
                                    </Button>
                                </div>

                                {fields.map((field) => (
                                    <div key={field.key} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 12 }}>
                                        <Form.Item name={[field.name, 'id']} hidden><Input /></Form.Item>
                                        <Form.Item
                                            {...field}
                                            name={[field.name, 'name']}
                                            rules={[{ required: true, message: 'Missing name' }]}
                                            style={{ flex: 1, marginBottom: 0 }}
                                        >
                                            <Input placeholder="Variant Name (e.g. Red, 2mm)" />
                                        </Form.Item>
                                        <Form.Item
                                            {...field}
                                            name={[field.name, 'quantityOnHand']}
                                            style={{ width: 100, marginBottom: 0 }}
                                        >
                                            <InputNumber placeholder="Initial Qty" min={0} style={{ width: '100%' }} />
                                        </Form.Item>
                                        <Form.Item
                                            {...field}
                                            name={[field.name, 'reorderLevel']}
                                            style={{ width: 100, marginBottom: 0 }}
                                        >
                                            <InputNumber placeholder="Reorder Lvl" min={0} style={{ width: '100%' }} />
                                        </Form.Item>
                                        {fields.length > 1 && (
                                            <Button type="text" danger onClick={() => remove(field.name)} icon={<DeleteOutlined />} style={{ marginTop: 4 }} />
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </Form.List>
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
