import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import AppLayout from './components/layout/AppLayout'
import HomeRedirect from './components/layout/HomeRedirect'
import ProtectedRoute from './components/layout/ProtectedRoute'
import { ROLES } from './constants/access'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Inventory from './pages/Inventory'
import Products from './pages/Products'
import Sales from './pages/Sales'
import Reports from './pages/Reports'
import Settings from './pages/Settings'
import Users from './pages/Users'

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/login" element={<Login />} />
                <Route
                    path="/"
                    element={
                        <ProtectedRoute>
                            <AppLayout />
                        </ProtectedRoute>
                    }
                >
                    <Route index element={<HomeRedirect />} />
                    <Route
                        path="dashboard"
                        element={
                            <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.MANAGER]}>
                                <Dashboard />
                            </ProtectedRoute>
                        }
                    />
                    <Route path="inventory" element={<Inventory />} />
                    <Route path="products" element={<Products />} />
                    <Route path="sales" element={<Sales />} />
                    <Route
                        path="reports"
                        element={
                            <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.MANAGER]}>
                                <Reports />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="users"
                        element={
                            <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.MANAGER]}>
                                <Users />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="settings"
                        element={
                            <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
                                <Settings />
                            </ProtectedRoute>
                        }
                    />
                </Route>
                <Route path="*" element={<ProtectedRoute><HomeRedirect /></ProtectedRoute>} />
            </Routes>
        </BrowserRouter>
    )
}

export default App
