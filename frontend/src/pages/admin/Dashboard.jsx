import { useState, useEffect } from 'react'
import Navbar from '../../components/Navbar'
import api from '../../api/axios'

const ESTADO_CARD = [
  { key: 'abierto', label: 'Abiertos', color: 'bg-green-50 border-green-200 text-green-700' },
  { key: 'en_progreso', label: 'En Progreso', color: 'bg-yellow-50 border-yellow-200 text-yellow-700' },
  { key: 'cerrado', label: 'Cerrados', color: 'bg-gray-50 border-gray-200 text-gray-600' },
]

const ESTADO_BADGE = {
  abierto: 'bg-green-100 text-green-700',
  en_progreso: 'bg-yellow-100 text-yellow-700',
  cerrado: 'bg-gray-100 text-gray-500',
}

export default function AdminDashboard() {
  const [stats, setStats] = useState(null)
  const [tickets, setTickets] = useState([])
  const [filtroEstado, setFiltroEstado] = useState('')
  const [ticketDetalle, setTicketDetalle] = useState(null)
  const [cargandoDetalle, setCargandoDetalle] = useState(false)

  const cargarStats = () => api.get('/admin/dashboard').then(({ data }) => setStats(data))

  const cargarTickets = async (estado = '') => {
    const params = estado ? `?estado=${estado}` : ''
    const { data } = await api.get(`/admin/tickets${params}`)
    setTickets(data)
  }

  useEffect(() => {
    cargarStats()
    cargarTickets()
  }, [])

  const verDetalle = async (id) => {
    setCargandoDetalle(true)
    try {
      const { data } = await api.get(`/admin/tickets/${id}`)
      setTicketDetalle(data)
    } finally {
      setCargandoDetalle(false)
    }
  }

  const cerrarTicket = async (id) => {
    if (!confirm('¿Cerrar este ticket manualmente?')) return
    await api.put(`/admin/tickets/${id}/cerrar`)
    setTicketDetalle(null)
    cargarTickets(filtroEstado)
    cargarStats()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>

        {/* Stats cards */}
        {stats && (
          <>
            <div className="grid grid-cols-3 gap-4">
              {ESTADO_CARD.map(({ key, label, color }) => (
                <div key={key} className={`rounded-2xl border-2 p-5 ${color}`}>
                  <p className="text-sm font-medium opacity-80">{label}</p>
                  <p className="text-4xl font-bold mt-1">{stats.tickets_por_estado[key]}</p>
                </div>
              ))}
            </div>

            {/* Rating por empleado */}
            {stats.rating_por_empleado.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5">
                <h2 className="font-semibold text-gray-700 mb-4">Rating por Empleado</h2>
                <div className="space-y-3">
                  {stats.rating_por_empleado.map((r) => (
                    <div key={r.id} className="flex items-center justify-between">
                      <span className="text-gray-800 font-medium">{r.nombre}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-yellow-500 font-bold text-lg">
                          {'★'.repeat(Math.round(r.promedio))}
                          {'☆'.repeat(5 - Math.round(r.promedio))}
                        </span>
                        <span className="text-gray-700 font-semibold">{r.promedio}</span>
                        <span className="text-gray-400 text-xs">({r.total} reseñas)</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* Listado de tickets */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-700">Todos los Tickets ({tickets.length})</h2>
            <select
              value={filtroEstado}
              onChange={(e) => { setFiltroEstado(e.target.value); cargarTickets(e.target.value) }}
              className="border border-gray-300 rounded-lg px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Todos</option>
              <option value="abierto">Abiertos</option>
              <option value="en_progreso">En Progreso</option>
              <option value="cerrado">Cerrados</option>
            </select>
          </div>

          <div className="space-y-2">
            {tickets.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-8">Sin tickets con este filtro.</p>
            )}
            {tickets.map((t) => (
              <div
                key={t.id}
                onClick={() => verDetalle(t.id)}
                className="flex items-center justify-between p-3 rounded-xl border border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-gray-800 truncate">{t.titulo}</p>
                  <p className="text-xs text-gray-400">
                    Cliente: {t.cliente_nombre} · Empleado: {t.empleado_nombre || '—'}
                  </p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full font-medium ml-3 flex-shrink-0 ${ESTADO_BADGE[t.estado]}`}>
                  {t.estado.replace('_', ' ')}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modal de detalle */}
      {ticketDetalle && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setTicketDetalle(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="font-bold text-lg text-gray-800">{ticketDetalle.titulo}</h2>
                  <p className="text-xs text-gray-400 mt-0.5">#{ticketDetalle.id}</p>
                </div>
                <button
                  onClick={() => setTicketDetalle(null)}
                  className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
                >
                  ×
                </button>
              </div>

              <p className="text-sm text-gray-600 mb-3">{ticketDetalle.descripcion}</p>

              <div className="flex gap-4 text-xs text-gray-500 mb-4">
                <span>Estado: <strong>{ticketDetalle.estado}</strong></span>
                <span>Prioridad: <strong>{ticketDetalle.prioridad}</strong></span>
                <span>Cliente: <strong>{ticketDetalle.cliente_nombre}</strong></span>
                {ticketDetalle.empleado_nombre && (
                  <span>Empleado: <strong>{ticketDetalle.empleado_nombre}</strong></span>
                )}
              </div>

              {ticketDetalle.mensajes.length > 0 && (
                <div className="mb-4">
                  <h3 className="font-semibold text-sm text-gray-700 mb-2">
                    Mensajes ({ticketDetalle.mensajes.length})
                  </h3>
                  <div className="space-y-2 max-h-40 overflow-y-auto bg-gray-50 rounded-xl p-3">
                    {ticketDetalle.mensajes.map((m) => (
                      <div key={m.id} className="text-sm">
                        <span className="font-medium text-indigo-600">{m.autor_nombre}:</span>{' '}
                        <span className="text-gray-700">{m.contenido}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {ticketDetalle.feedback && (
                <div className="mb-4 bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                  <p className="font-semibold text-sm text-gray-700">
                    Feedback:{' '}
                    <span className="text-yellow-500">{'★'.repeat(ticketDetalle.feedback.estrellas)}</span>
                    <span className="text-gray-300">{'★'.repeat(5 - ticketDetalle.feedback.estrellas)}</span>
                    <span className="text-gray-600 ml-1">({ticketDetalle.feedback.estrellas}/5)</span>
                  </p>
                  {ticketDetalle.feedback.comentario && (
                    <p className="text-sm text-gray-600 mt-1 italic">"{ticketDetalle.feedback.comentario}"</p>
                  )}
                </div>
              )}

              {ticketDetalle.estado !== 'cerrado' && (
                <button
                  onClick={() => cerrarTicket(ticketDetalle.id)}
                  className="w-full bg-red-500 text-white py-2 rounded-xl text-sm font-semibold hover:bg-red-600 transition-colors"
                >
                  Cerrar Ticket Manualmente
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
