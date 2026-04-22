import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../../components/Navbar'
import api from '../../api/axios'

export default function NuevoTicket() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ titulo: '', descripcion: '', prioridad: 'media' })
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setEnviando(true)
    try {
      await api.post('/tickets', form)
      navigate('/cliente/tickets')
    } catch (err) {
      setError(err.response?.data?.error || 'Error al crear el ticket')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-lg mx-auto p-6">
        <button
          onClick={() => navigate('/cliente/tickets')}
          className="text-indigo-600 text-sm hover:underline mb-4 block"
        >
          ← Volver a mis tickets
        </button>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <h1 className="text-xl font-bold text-gray-800 mb-5">Nuevo Ticket de Soporte</h1>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Título</label>
              <input
                value={form.titulo}
                onChange={(e) => setForm({ ...form, titulo: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Describí brevemente el problema"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
              <textarea
                value={form.descripcion}
                onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                rows={4}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                placeholder="Detallá el problema con toda la información relevante..."
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Prioridad</label>
              <div className="grid grid-cols-3 gap-2">
                {['baja', 'media', 'alta'].map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setForm({ ...form, prioridad: p })}
                    className={`py-2 rounded-lg text-sm font-semibold border-2 transition-all ${
                      form.prioridad === p
                        ? p === 'alta'
                          ? 'border-red-500 bg-red-50 text-red-600'
                          : p === 'media'
                          ? 'border-yellow-500 bg-yellow-50 text-yellow-600'
                          : 'border-green-500 bg-green-50 text-green-600'
                        : 'border-gray-200 text-gray-500 hover:border-gray-300'
                    }`}
                  >
                    {p.charAt(0).toUpperCase() + p.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <p className="text-red-500 text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={enviando}
              className="w-full bg-indigo-600 text-white py-2 rounded-lg font-semibold text-sm hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              {enviando ? 'Enviando...' : 'Crear Ticket'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
