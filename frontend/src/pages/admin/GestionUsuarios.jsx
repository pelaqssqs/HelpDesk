import { useState, useEffect } from 'react'
import Navbar from '../../components/Navbar'
import api from '../../api/axios'

const ROL_BADGE = {
  admin: 'bg-purple-100 text-purple-700',
  empleado: 'bg-blue-100 text-blue-700',
  cliente: 'bg-green-100 text-green-700',
}

export default function GestionUsuarios() {
  const [usuarios, setUsuarios] = useState([])
  const [form, setForm] = useState({ nombre: '', email: '', rol: 'empleado' })
  const [resultado, setResultado] = useState(null)
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(false)

  const cargar = async () => {
    const { data } = await api.get('/admin/usuarios')
    setUsuarios(data)
  }

  useEffect(() => { cargar() }, [])

  const crear = async (e) => {
    e.preventDefault()
    setError('')
    setResultado(null)
    setCargando(true)
    try {
      const { data } = await api.post('/admin/usuarios', form)
      setResultado(data)
      setForm({ nombre: '', email: '', rol: 'empleado' })
      cargar()
    } catch (err) {
      setError(err.response?.data?.error || 'Error al crear usuario')
    } finally {
      setCargando(false)
    }
  }

  const eliminar = async (id) => {
    if (!confirm('¿Eliminar este usuario? Esta acción no se puede deshacer.')) return
    try {
      await api.delete(`/admin/usuarios/${id}`)
      cargar()
    } catch (err) {
      alert(err.response?.data?.error || 'Error al eliminar')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <h1 className="text-2xl font-bold text-gray-800">Gestión de Usuarios</h1>

        {/* Formulario de creación */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-700 mb-4">Crear nuevo usuario</h2>
          <form onSubmit={crear} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input
              placeholder="Nombre completo"
              value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
            <input
              type="email"
              placeholder="Email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
            <select
              value={form.rol}
              onChange={(e) => setForm({ ...form, rol: e.target.value })}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="empleado">Empleado</option>
              <option value="cliente">Cliente</option>
            </select>
            <button
              type="submit"
              disabled={cargando}
              className="sm:col-span-3 bg-indigo-600 text-white py-2 rounded-lg font-semibold text-sm hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              {cargando ? 'Creando...' : 'Crear Usuario'}
            </button>
          </form>

          {error && (
            <p className="text-red-500 text-sm mt-3 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          {resultado && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-xl">
              <p className="text-green-700 font-semibold text-sm">
                Usuario <strong>{resultado.usuario.nombre}</strong> creado exitosamente.
              </p>
              <p className="text-sm text-gray-600 mt-2">
                Contraseña temporal (copiala ahora, no se mostrará de nuevo):
              </p>
              <div className="mt-1 flex items-center gap-2">
                <code className="text-base font-mono bg-white border rounded px-3 py-1 select-all tracking-wider">
                  {resultado.password_temporal}
                </code>
                <button
                  onClick={() => navigator.clipboard.writeText(resultado.password_temporal)}
                  className="text-xs text-indigo-600 hover:underline"
                >
                  Copiar
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Tabla de usuarios */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100">
            <h2 className="font-semibold text-gray-700">Usuarios registrados ({usuarios.length})</h2>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
              <tr>
                <th className="text-left px-5 py-3">Nombre</th>
                <th className="text-left px-5 py-3">Email</th>
                <th className="text-left px-5 py-3">Rol</th>
                <th className="text-left px-5 py-3">Estado</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {usuarios.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3 font-medium text-gray-800">{u.nombre}</td>
                  <td className="px-5 py-3 text-gray-500">{u.email}</td>
                  <td className="px-5 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${ROL_BADGE[u.rol]}`}>
                      {u.rol}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    {u.debe_cambiar_password ? (
                      <span className="text-xs text-orange-500 font-medium">Pendiente primer login</span>
                    ) : (
                      <span className="text-xs text-green-500 font-medium">Activo</span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-right">
                    {u.rol !== 'admin' && (
                      <button
                        onClick={() => eliminar(u.id)}
                        className="text-red-400 hover:text-red-600 text-xs hover:underline"
                      >
                        Eliminar
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
