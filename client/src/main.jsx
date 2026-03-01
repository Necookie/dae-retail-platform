import React from 'react'
import ReactDOM from 'react-dom/client'
import { ConfigProvider } from 'antd'
import App from './App.jsx'
import '@fontsource/inter'
import './index.css'

const theme = {
    token: {
        colorPrimary: '#b57b6f', // Terracotta / Dusty Rose
        colorSuccess: '#7e8f7a', // Muted Sage
        colorWarning: '#d4b78c', // Soft Amber / Parchment
        colorError: '#b06a6a', // Muted Red
        borderRadius: 8,
        borderRadiusLG: 12,
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
        colorBgContainer: '#ffffff',
        colorBgLayout: '#F5F2EB', // Warm off-white / parchment back
        colorBorder: '#e8e4db', // Warmer light neutral
        colorText: '#2b2624', // Warmer charcoal
    },
}

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <ConfigProvider theme={theme}>
            <App />
        </ConfigProvider>
    </React.StrictMode>,
)
