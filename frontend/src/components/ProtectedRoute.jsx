import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function ProtectedRoute({ children, roles }) {
  const { usuario, cargando } = useAuth()

  if (cargando) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-gray-400">Cargando...</div>
      </div>
    )
  }

  if (!usuario) return <Navigate to="/login" replace />
  if (roles && !roles.includes(usuario.rol)) return <Navigate to="/login" replace />

  return children
}
