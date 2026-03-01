// src/pages/Dashboard.jsx
import { useEffect, useState } from 'react'
import { Row, Col, Card, Statistic, Table, Tag, Spin, Typography, Badge } from 'antd'
import {
    DollarOutlined, RiseOutlined, ShoppingCartOutlined, WarningOutlined,
} from '@ant-design/icons'
import api from '../api/axios'
import dayjs from 'dayjs'

const { Title, Text } = Typography

const KpiCard = ({ title, value, prefix, color, suffix }) => (
    <Card className="stat-card" style={{ borderTop: `3px solid ${color}` }}>
        <Statistic
            title={title}
            value={value}
            prefix={prefix}
            suffix={suffix}
            valueStyle={{ color, fontSize: 28, fontWeight: 700 }}
        />
    </Card>
)

const Dashboard = () => {
    const [kpis, setKpis] = useState(null)
    const [recentSales, setRecentSales] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [kpiRes, salesRes] = await Promise.all([
                    api.get('/reports/dashboard'),
                    api.get('/sales?limit=10'),
                ])
                setKpis(kpiRes.data.data)
                setRecentSales(salesRes.data.data)
            } catch (err) {
                console.error('Dashboard fetch error', err)
            } finally {
                setLoading(false)
            }
        }
        fetchData()
    }, [])

    const salesColumns = [
        { title: 'Product', dataIndex: ['product', 'name'], key: 'product', ellipsis: true },
        { title: 'Qty', dataIndex: 'quantity', key: 'quantity', width: 60 },
        {
            title: 'Revenue',
            dataIndex: 'totalRevenue',
            key: 'revenue',
            render: (v) => `₱${parseFloat(v).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`,
        },
        {
            title: 'Profit',
            dataIndex: 'profit',
            key: 'profit',
            render: (v) => <Text style={{ color: parseFloat(v) >= 0 ? '#7e8f7a' : '#b06a6a', fontWeight: 600 }}>
                ₱{parseFloat(v).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
            </Text>,
        },
        {
            title: 'Payment',
            dataIndex: 'paymentStatus',
            key: 'paymentStatus',
            render: (s) => (
                <Tag className={`status-${s.toLowerCase()}`}>
                    {s}
                </Tag>
            ),
        },
        {
            title: 'Date',
            dataIndex: 'saleDate',
            key: 'date',
            render: (d) => dayjs(d).format('MMM D, YYYY h:mm A'),
        },
    ]

    if (loading) return <div style={{ textAlign: 'center', padding: 80 }}><Spin size="large" /></div>

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Dashboard</h1>
                    <p className="page-subtitle">Overview of today's operations</p>
                </div>
            </div>

            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                <Col xs={24} sm={12} lg={6}>
                    <KpiCard
                        title="Today's Revenue"
                        value={kpis?.today?.revenue ?? 0}
                        prefix="₱"
                        color="#b57b6f"
                    />
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <KpiCard
                        title="Today's Profit"
                        value={kpis?.today?.profit ?? 0}
                        prefix="₱"
                        color="#7e8f7a"
                    />
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <KpiCard
                        title="Monthly Revenue"
                        value={kpis?.month?.revenue ?? 0}
                        prefix="₱"
                        color="#d4b78c"
                    />
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <KpiCard
                        title="Low Stock Items"
                        value={kpis?.lowStockCount ?? 0}
                        color="#b06a6a"
                        suffix="items"
                    />
                </Col>
            </Row>

            <Row gutter={[24, 24]}>
                <Col xs={24} lg={16}>
                    <Card
                        title={<><ShoppingCartOutlined style={{ marginRight: 8 }} />Recent Sales</>}
                        style={{ borderRadius: 12, height: '100%' }}
                    >
                        <Table
                            dataSource={recentSales}
                            columns={salesColumns}
                            rowKey="id"
                            pagination={false}
                            size="middle"
                            scroll={{ x: 'max-content' }}
                        />
                    </Card>
                </Col>
                <Col xs={24} lg={8}>
                    <Card
                        title={<><WarningOutlined style={{ marginRight: 8 }} />Pending Production</>}
                        style={{ borderRadius: 12, height: '100%', background: 'var(--card-bg)' }}
                    >
                        <div style={{ textAlign: 'center', padding: '60px 0' }}>
                            <Text type="secondary" style={{ display: 'block', marginBottom: 8 }}>
                                No urgent production pending.
                            </Text>
                            <Tag className="status-pending">All caught up</Tag>
                        </div>
                    </Card>
                </Col>
            </Row>
        </div>
    )
}

export default Dashboard
