// src/pages/Reports.jsx
import { useState, useEffect } from 'react'
import { Row, Col, Card, Table, Statistic, DatePicker, Typography, Tag, Spin, Tabs } from 'antd'
import { BarChartOutlined, DollarOutlined, InboxOutlined, TrophyOutlined } from '@ant-design/icons'
import api from '../api/axios'
import dayjs from 'dayjs'

const { Text } = Typography
const { RangePicker } = DatePicker

const Reports = () => {
    const [revenue, setRevenue] = useState(null)
    const [inventory, setInventory] = useState(null)
    const [topProducts, setTopProducts] = useState([])
    const [loading, setLoading] = useState(false)
    const [dateRange, setDateRange] = useState([dayjs().startOf('month'), dayjs()])

    const fetchReports = async (start, end) => {
        setLoading(true)
        try {
            const startDate = start.format('YYYY-MM-DD')
            const endDate = end.format('YYYY-MM-DD')
            const [revRes, invRes, topRes] = await Promise.all([
                api.get('/reports/revenue', { params: { startDate, endDate } }),
                api.get('/reports/inventory-value'),
                api.get('/reports/top-products', { params: { startDate, endDate, limit: 10 } }),
            ])
            setRevenue(revRes.data.data)
            setInventory(invRes.data.data)
            setTopProducts(topRes.data.data)
        } catch (e) {
            console.error('Reports fetch error', e)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchReports(dateRange[0], dateRange[1])
    }, [])

    const handleDateChange = (dates) => {
        if (dates?.length === 2) {
            setDateRange(dates)
            fetchReports(dates[0], dates[1])
        }
    }

    const salesColumns = [
        { title: 'Product', dataIndex: ['product', 'name'], ellipsis: true },
        { title: 'Qty', dataIndex: 'quantity', width: 60 },
        { title: 'Revenue', dataIndex: 'totalRevenue', render: (v) => `₱${parseFloat(v).toLocaleString('en-PH', { minimumFractionDigits: 2 })}` },
        {
            title: 'Prod. Cost',
            dataIndex: 'productionCostSnapshot',
            render: (v) => `₱${parseFloat(v).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`,
        },
        {
            title: 'Profit',
            dataIndex: 'profit',
            render: (v) => <Text style={{ color: parseFloat(v) >= 0 ? 'var(--success)' : 'var(--danger)', fontWeight: 600 }}>₱{parseFloat(v).toLocaleString('en-PH', { minimumFractionDigits: 2 })}</Text>,
        },
        {
            title: 'Payment',
            dataIndex: 'paymentStatus',
            render: (s) => <Tag color={{ PAID: 'green', UNPAID: 'red', PARTIAL: 'orange' }[s]}>{s}</Tag>,
        },
        { title: 'Date', dataIndex: 'saleDate', render: (d) => dayjs(d).format('MMM D, YYYY') },
    ]

    const topProductColumns = [
        { title: '#', render: (_, __, i) => i + 1, width: 40 },
        { title: 'Product', dataIndex: 'productName' },
        { title: 'Qty Sold', dataIndex: 'totalQuantity' },
        { title: 'Revenue', dataIndex: 'totalRevenue', render: (v) => `₱${v?.toLocaleString('en-PH', { minimumFractionDigits: 2 })}` },
        { title: 'Profit', dataIndex: 'totalProfit', render: (v) => <Text style={{ color: 'var(--success)', fontWeight: 600 }}>₱{v?.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</Text> },
    ]

    const inventoryColumns = [
        { title: 'Material', dataIndex: 'name' },
        { title: 'Unit', dataIndex: 'unit', width: 70 },
        { title: 'On Hand', dataIndex: 'quantityOnHand', render: (v, r) => `${v.toFixed(2)} ${r.unit}` },
        { title: 'Avg Cost', dataIndex: 'weightedAvgCost', render: (v) => `₱${v.toFixed(4)}` },
        { title: 'Total Value', dataIndex: 'totalValue', render: (v) => `₱${v.toLocaleString('en-PH', { minimumFractionDigits: 2 })}` },
        {
            title: 'Status',
            dataIndex: 'isLowStock',
            render: (v) => v ? <Tag color="red">LOW STOCK</Tag> : <Tag color="green">OK</Tag>,
        },
    ]

    const items = [
        {
            key: 'revenue',
            label: <><BarChartOutlined /> Revenue &amp; Profit</>,
            children: (
                <Table
                    dataSource={revenue?.sales}
                    columns={salesColumns}
                    rowKey="id"
                    size="middle"
                    pagination={{ pageSize: 20, showSizeChanger: true }}
                />
            ),
        },
        {
            key: 'top',
            label: <><TrophyOutlined /> Top Products</>,
            children: (
                <Table
                    dataSource={topProducts}
                    columns={topProductColumns}
                    rowKey="productId"
                    pagination={false}
                />
            ),
        },
        {
            key: 'inventory',
            label: <><InboxOutlined /> Inventory Value</>,
            children: (
                <Table
                    dataSource={inventory?.items}
                    columns={inventoryColumns}
                    rowKey="id"
                    pagination={{ pageSize: 20 }}
                    rowClassName={(r) => r.isLowStock ? 'low-stock-row' : ''}
                />
            ),
        },
    ]

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Reports</h1>
                    <p className="page-subtitle">Revenue, profit, and inventory analysis</p>
                </div>
                <RangePicker value={dateRange} onChange={handleDateChange} />
            </div>

            <Spin spinning={loading}>
                <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                    <Col xs={24} sm={12} lg={6}>
                        <Card className="stat-card" style={{ borderTop: '3px solid var(--primary)' }}>
                            <Statistic title="Total Revenue" value={revenue?.totalRevenue ?? 0} prefix="₱" precision={2} valueStyle={{ color: 'var(--primary)', fontWeight: 700 }} />
                        </Card>
                    </Col>
                    <Col xs={24} sm={12} lg={6}>
                        <Card className="stat-card" style={{ borderTop: '3px solid var(--success)' }}>
                            <Statistic title="Total Profit" value={revenue?.totalProfit ?? 0} prefix="₱" precision={2} valueStyle={{ color: 'var(--success)', fontWeight: 700 }} />
                        </Card>
                    </Col>
                    <Col xs={24} sm={12} lg={6}>
                        <Card className="stat-card" style={{ borderTop: '3px solid var(--warning)' }}>
                            <Statistic title="Profit Margin" value={revenue?.profitMargin ?? 0} suffix="%" valueStyle={{ color: 'var(--warning)', fontWeight: 700 }} />
                        </Card>
                    </Col>
                    <Col xs={24} sm={12} lg={6}>
                        <Card className="stat-card" style={{ borderTop: '3px solid var(--sidebar-text)' }}>
                            <Statistic title="Inventory Value" value={inventory?.totalValue ?? 0} prefix="₱" precision={2} valueStyle={{ color: 'var(--sidebar-text)', fontWeight: 700 }} />
                        </Card>
                    </Col>
                </Row>

                <Card style={{ borderRadius: 12, border: '1px solid var(--border)' }}>
                    <Tabs items={items} size="large" tabBarGutter={32} />
                </Card>
            </Spin>
        </div>
    )
}

export default Reports
