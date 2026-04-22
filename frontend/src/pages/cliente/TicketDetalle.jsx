import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Navbar from '../../components/Navbar'
import Chat from '../../components/Chat'
import api from '../../api/axios'

export default function ClienteTicketDetalle() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [ticket, setTicket] = useState(null)

  useEffect(() => {
    api.get(`/tickets/${id}`)
      .then(({ data }) => setTicket(data))
      .catch(() => navigate('/cliente/tickets'))
  }, [id])

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
          onClick={() => navigate('/cliente/tickets')}
          className="text-indigo-600 text-sm hover:underline"
        >
          ← Volver a mis tickets
        </button>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5">
          <h1 className="text-xl font-bold text-gray-800 mb-2">{ticket.titulo}</h1>
          <p className="text-gray-600 text-sm mb-3">{ticket.descripcion}</p>
          <div className="flex flex-wrap gap-4 text-xs text-gray-400">
            <span>Prioridad: <strong className="text-gray-600">{ticket.prioridad}</strong></span>
            <span>
              Empleado:{' '}
              <strong className="text-gray-600">{ticket.empleado_nombre || 'Esperando asignación...'}</strong>
            </span>
            {ticket.es_reabierto && (
              <span className="bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full">
                Reabierto (origen: #{ticket.ticket_origen_id})
              </span>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-700 mb-3">Chat con el soporte</h2>
          <Chat ticketId={parseInt(id)} activo={ticket.estado === 'en_progreso'} />
        </div>
      </div>
    </div>
  )
}
