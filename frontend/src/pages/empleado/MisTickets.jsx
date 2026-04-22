import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../../components/Navbar'
import TicketCard from '../../components/TicketCard'
import api from '../../api/axios'
import { useAuth } from '../../context/AuthContext'

export default function EmpleadoMisTickets() {
  const { usuario } = useAuth()
  const navigate = useNavigate()
  const [tickets, setTickets] = useState([])
  const [sinLeer, setSinLeer] = useState({})
  const [cargando, setCargando] = useState(true)

  const cargar = async () => {
    try {
      const { data } = await api.get('/tickets')
      setTickets(data)

      // Contar mensajes sin leer solo en tickets en progreso propios
      const counts = {}
      const enProgreso = data.filter(
        (t) => t.estado === 'en_progreso' && t.id_empleado === usuario.id
      )
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

  const tomar = async (e, id) => {
    e.stopPropagation()
    await api.put(`/tickets/${id}/tomar`)
    cargar()
  }

  const abiertos = tickets.filter((t) => t.estado === 'abierto')
  const enProgreso = tickets.filter((t) => t.estado === 'en_progreso')

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
        <h1 className="text-2xl font-bold text-gray-800">Panel de Tickets</h1>

        {/* Tickets disponibles */}
        <section>
          <h2 className="font-semibold text-gray-600 mb-3 flex items-center gap-2">
            Tickets Disponibles
            <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full font-bold">
              {abiertos.length}
            </span>
          </h2>
          <div className="space-y-3">
            {abiertos.length === 0 && (
              <p className="text-sm text-gray-400 bg-white rounded-xl border border-gray-100 p-5 text-center">
                No hay tickets abiertos disponibles.
              </p>
            )}
            {abiertos.map((t) => (
              <TicketCard
                key={t.id}
                ticket={t}
                accion={
                  <button
                    onClick={(e) => tomar(e, t.id)}
                    className="text-xs bg-indigo-600 text-white px-3 py-1 rounded-lg hover:bg-indigo-700 transition-colors font-semibold"
                  >
                    Tomar
                  </button>
                }
              />
            ))}
          </div>
        </section>

        {/* Mis tickets en progreso */}
        <section>
          <h2 className="font-semibold text-gray-600 mb-3 flex items-center gap-2">
            Mis Tickets en Progreso
            <span className="bg-yellow-100 text-yellow-700 text-xs px-2 py-0.5 rounded-full font-bold">
              {enProgreso.length}
            </span>
          </h2>
          <div className="space-y-3">
            {enProgreso.length === 0 && (
              <p className="text-sm text-gray-400 bg-white rounded-xl border border-gray-100 p-5 text-center">
                No tenés tickets asignados. Tomá uno de la lista de arriba.
              </p>
            )}
            {enProgreso.map((t) => (
              <TicketCard
                key={t.id}
                ticket={t}
                mensajesSinLeer={sinLeer[t.id] || 0}
                onClick={() => navigate(`/empleado/tickets/${t.id}`)}
              />
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
