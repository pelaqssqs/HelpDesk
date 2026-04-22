import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'

export default function CambiarPassword() {
  const { usuario, actualizarUsuario } = useAuth()
  const navigate = useNavigate()
  const [nueva, setNueva] = useState('')
  const [confirmar, setConfirmar] = useState('')
  const [error, setError] = useState('')
  const [ok, setOk] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (nueva !== confirmar) { setError('Las contraseñas no coinciden'); return }
    if (nueva.length < 6) { setError('Mínimo 6 caracteres'); return }

    try {
      await api.post('/auth/cambiar-password', { nueva_password: nueva })
      actualizarUsuario({ debe_cambiar_password: false })
      setOk(true)
      setTimeout(() => {
        if (usuario.rol === 'admin') navigate('/admin/dashboard')
        else if (usuario.rol === 'empleado') navigate('/empleado/tickets')
        else navigate('/cliente/tickets')
      }, 1500)
    } catch (err) {
      setError(err.response?.data?.error || 'Error al cambiar contraseña')
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-sm">
        <h1 className="text-xl font-bold text-indigo-700 mb-1">Cambiá tu contraseña</h1>
        <p className="text-sm text-gray-500 mb-6">
          Es tu primer ingreso. Debés establecer una nueva contraseña para continuar.
        </p>

        {ok ? (
          <div className="text-center py-4">
            <p className="text-green-600 font-semibold">¡Contraseña actualizada!</p>
            <p className="text-sm text-gray-400 mt-1">Redirigiendo...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nueva contraseña</label>
              <input
                type="password"
                value={nueva}
                onChange={(e) => setNueva(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Mínimo 6 caracteres"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirmar contraseña</label>
              <input
                type="password"
                value={confirmar}
                onChange={(e) => setConfirmar(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Repetí la contraseña"
                required
              />
            </div>

            {error && (
              <p className="text-red-500 text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              className="w-full bg-indigo-600 text-white py-2 rounded-lg font-semibold text-sm hover:bg-indigo-700 transition-colors"
            >
              Confirmar nueva contraseña
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
