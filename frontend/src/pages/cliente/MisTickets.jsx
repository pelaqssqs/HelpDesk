import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../../components/Navbar'
import TicketCard from '../../components/TicketCard'
import api from '../../api/axios'
import { useAuth } from '../../context/AuthContext'

export default function ClienteMisTickets() {
  const { usuario } = useAuth()
  const navigate = useNavigate()
  const [tickets, setTickets] = useState([])
  const [sinLeer, setSinLeer] = useState({})
  const [cargando, setCargando] = useState(true)

  const cargar = async () => {
    try {
      const { data } = await api.get('/tickets')
      setTickets(data)

      // Contar mensajes sin leer en tickets en progreso
      const counts = {}
      const enProgreso = data.filter((t) => t.estado === 'en_progreso')
      await Promise.all(
        enProgreso.map(async (t) => {
          const { data: msgs } = await api.get(`/tickets/${t.id}/mensajes`)
          counts[t.id] = msgs.filter((m) => !m.leido && m.id_usuario !== usuario.id).length
        })
      )
      setSinLeer(counts)
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => { cargar() }, [])

  const reabrir = async (e, id) => {
    e.stopPropagation()
    if (!confirm('¿Reabrir este ticket? Se creará un nuevo ticket haciendo referencia a este.')) return
    await api.post(`/tickets/${id}/reabrir`)
    cargar()
  }

  const activos = tickets.filter((t) => t.estado !== 'cerrado')
  const cerrados = tickets.filter((t) => t.estado === 'cerrado')

  if (cargando) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center h-64 text-gray-400">Cargando tickets...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-2xl mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-800">Mis Tickets</h1>
          <button
            onClick={() => navigate('/cliente/nuevo-ticket')}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-indigo-700 transition-colors"
          >
            + Nuevo Ticket
          </button>
        </div>

        {/* Tickets activos */}
        <section>
          <h2 className="font-semibold text-gray-600 mb-3 flex items-center gap-2">
            Activos
            <span className="bg-indigo-100 text-indigo-700 text-xs px-2 py-0.5 rounded-full font-bold">
              {activos.length}
            </span>
          </h2>
          <div className="space-y-3">
            {activos.length === 0 && (
              <p className="text-sm text-gray-400 bg-white rounded-xl border border-gray-100 p-5 text-center">
                No tenés tickets activos.{' '}
                <button
                  onClick={() => navigate('/cliente/nuevo-ticket')}
                  className="text-indigo-600 hover:underline"
                >
                  Crear uno nuevo
                </button>
              </p>
            )}
            {activos.map((t) => (
              <TicketCard
                key={t.id}
                ticket={t}
                mensajesSinLeer={sinLeer[t.id] || 0}
                onClick={t.estado === 'en_progreso' ? () => navigate(`/cliente/tickets/${t.id}`) : undefined}
              />
            ))}
          </div>
        </section>

        {/* Tickets cerrados */}
        <section>
          <h2 className="font-semibold text-gray-600 mb-3 flex items-center gap-2">
            Cerrados
            <span className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full font-bold">
              {cerrados.length}
            </span>
          </h2>
          <div className="space-y-3">
            {cerrados.length === 0 && (
              <p className="text-sm text-gray-400 text-center">Sin tickets cerrados.</p>
            )}
            {cerrados.map((t) => (
              <TicketCard
                key={t.id}
                ticket={t}
                accion={
                  <div className="flex gap-2">
                    {!t.tiene_feedback && (
                      <button
                        onClick={(e) => { e.stopPropagation(); navigate(`/cliente/feedback/${t.id}`) }}
                        className="text-xs bg-yellow-400 text-yellow-900 px-2 py-1 rounded-lg hover:bg-yellow-500 transition-colors font-semibold"
                      >
                        ★ Feedback
                      </button>
                    )}
                    <button
                      onClick={(e) => reabrir(e, t.id)}
                      className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded-lg hover:bg-gray-300 transition-colors font-semibold"
                    >
                      Reabrir
                    </button>
                  </div>
                }
              />
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
