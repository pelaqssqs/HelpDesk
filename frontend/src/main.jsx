import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import './index.css'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'

import Login from './pages/Login'
import CambiarPassword from './pages/CambiarPassword'
import AdminDashboard from './pages/admin/Dashboard'
import GestionUsuarios from './pages/admin/GestionUsuarios'
import EmpleadoTickets from './pages/empleado/MisTickets'
import EmpleadoTicketDetalle from './pages/empleado/TicketDetalle'
import EmpleadoPerfil from './pages/empleado/Perfil'
import ClienteTickets from './pages/cliente/MisTickets'
import ClienteNuevoTicket from './pages/cliente/NuevoTicket'
import ClienteTicketDetalle from './pages/cliente/TicketDetalle'
import ClienteFeedback from './pages/cliente/Feedback'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/cambiar-password" element={<CambiarPassword />} />

          <Route path="/admin/dashboard" element={
            <ProtectedRoute roles={['admin']}><AdminDashboard /></ProtectedRoute>
          } />
          <Route path="/admin/usuarios" element={
            <ProtectedRoute roles={['admin']}><GestionUsuarios /></ProtectedRoute>
          } />

          <Route path="/empleado/tickets" element={
            <ProtectedRoute roles={['empleado']}><EmpleadoTickets /></ProtectedRoute>
          } />
          <Route path="/empleado/tickets/:id" element={
            <ProtectedRoute roles={['empleado']}><EmpleadoTicketDetalle /></ProtectedRoute>
          } />
          <Route path="/empleado/perfil" element={
            <ProtectedRoute roles={['empleado']}><EmpleadoPerfil /></ProtectedRoute>
          } />

          <Route path="/cliente/tickets" element={
            <ProtectedRoute roles={['cliente']}><ClienteTickets /></ProtectedRoute>
          } />
          <Route path="/cliente/nuevo-ticket" element={
            <ProtectedRoute roles={['cliente']}><ClienteNuevoTicket /></ProtectedRoute>
          } />
          <Route path="/cliente/tickets/:id" element={
            <ProtectedRoute roles={['cliente']}><ClienteTicketDetalle /></ProtectedRoute>
          } />
          <Route path="/cliente/feedback/:id" element={
            <ProtectedRoute roles={['cliente']}><ClienteFeedback /></ProtectedRoute>
          } />

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
