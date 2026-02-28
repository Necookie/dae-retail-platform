import React from 'react'
import ReactDOM from 'react-dom/client'
import { ConfigProvider } from 'antd'
import App from './App.jsx'
import '@fontsource/inter'
import './index.css'

const theme = {
    token: {
        colorPrimary: '#c08497', // Muted rose
        colorSuccess: '#a9bca5', // Muted sage
        colorWarning: '#e9d6af', // Soft amber
        colorError: '#d99a9a', // Dusty rose
        borderRadius: 12,
        borderRadiusLG: 16,
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
        colorBgContainer: '#ffffff',
        colorBgLayout: '#F8F6F2', // Warm off-white
        colorBorder: '#eaeaea', // Light neutral gray
        colorText: '#2a2a2a', // Near-black charcoal
    },
}

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <ConfigProvider theme={theme}>
            <App />
        </ConfigProvider>
    </React.StrictMode>,
)
