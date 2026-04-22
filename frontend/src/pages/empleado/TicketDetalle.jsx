import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Navbar from '../../components/Navbar'
import Chat from '../../components/Chat'
import api from '../../api/axios'

const PRIORIDAD_COLOR = {
  alta: 'text-red-600 font-bold',
  media: 'text-yellow-600 font-semibold',
  baja: 'text-green-600',
}

export default function EmpleadoTicketDetalle() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [ticket, setTicket] = useState(null)
  const [editandoPrioridad, setEditandoPrioridad] = useState(false)
  const [nuevaPrioridad, setNuevaPrioridad] = useState('')

  const cargar = async () => {
    try {
      const { data } = await api.get(`/tickets/${id}`)
      setTicket(data)
      setNuevaPrioridad(data.prioridad)
    } catch {
      navigate('/empleado/tickets')
    }
  }

  useEffect(() => { cargar() }, [id])

  const liberar = async () => {
    if (!confirm('¿Liberar el ticket? Volverá a estar disponible para otros empleados.')) return
    await api.put(`/tickets/${id}/liberar`)
    navigate('/empleado/tickets')
  }

  const cerrar = async () => {
    if (!confirm('¿Cerrar este ticket? El cliente recibirá una notificación para dejar feedback.')) return
    await api.put(`/tickets/${id}/cerrar`)
    navigate('/empleado/tickets')
  }

  const guardarPrioridad = async () => {
    await api.put(`/tickets/${id}/prioridad`, { prioridad: nuevaPrioridad })
    setEditandoPrioridad(false)
    cargar()
  }

  if (!ticket) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center h-64 text-gray-400">Cargando...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-2xl mx-auto p-6 space-y-4">
        <button
          onClick={() => navigate('/empleado/tickets')}
          className="text-indigo-600 text-sm hover:underline flex items-center gap-1"
        >
          ← Volver a mis tickets
        </button>

        {/* Info del ticket */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5">
          <div className="flex items-start justify-between gap-2 mb-3">
            <h1 className="text-xl font-bold text-gray-800">{ticket.titulo}</h1>
            <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full font-medium whitespace-nowrap">
              en progreso
            </span>
          </div>

          <p className="text-gray-600 text-sm mb-3">{ticket.descripcion}</p>

          <div className="text-xs text-gray-400 mb-4">
            <span>Cliente: <strong className="text-gray-600">{ticket.cliente_nombre}</strong></span>
            {ticket.ticket_origen_id && (
              <span className="ml-3 bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full">
                Reabierto (origen: #{ticket.ticket_origen_id})
              </span>
            )}
          </div>

          {/* Prioridad editable */}
          <div className="flex items-center gap-2 mb-5">
            <span className="text-sm text-gray-500">Prioridad:</span>
            {editandoPrioridad ? (
              <>
                <select
                  value={nuevaPrioridad}
                  onChange={(e) => setNuevaPrioridad(e.target.value)}
                  className="border border-gray-300 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="baja">Baja</option>
                  <option value="media">Media</option>
                  <option value="alta">Alta</option>
                </select>
                <button
                  onClick={guardarPrioridad}
                  className="text-sm text-indigo-600 hover:underline font-medium"
                >
                  Guardar
                </button>
                <button
                  onClick={() => setEditandoPrioridad(false)}
                  className="text-sm text-gray-400 hover:underline"
                >
                  Cancelar
                </button>
              </>
            ) : (
              <>
                <span className={`text-sm ${PRIORIDAD_COLOR[ticket.prioridad]}`}>
                  ▲ {ticket.prioridad}
                </span>
                <button
                  onClick={() => setEditandoPrioridad(true)}
                  className="text-xs text-gray-400 hover:text-indigo-500 hover:underline"
                >
                  Editar
                </button>
              </>
            )}
          </div>

          {/* Acciones */}
          <div className="flex gap-3">
            <button
              onClick={cerrar}
              className="flex-1 bg-green-600 text-white py-2 rounded-xl text-sm font-semibold hover:bg-green-700 transition-colors"
            >
              Cerrar Ticket
            </button>
            <button
              onClick={liberar}
              className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-xl text-sm font-semibold hover:bg-gray-200 transition-colors"
            >
              Liberar Ticket
            </button>
          </div>
        </div>

        {/* Chat */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-700 mb-3">Chat con el cliente</h2>
          <Chat ticketId={parseInt(id)} activo={true} />
        </div>
      </div>
    </div>
  )
}
