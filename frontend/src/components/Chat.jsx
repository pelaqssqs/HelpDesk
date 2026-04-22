import { useState, useEffect, useRef } from 'react'
import api from '../api/axios'
import { useAuth } from '../context/AuthContext'

export default function Chat({ ticketId, activo }) {
  const { usuario } = useAuth()
  const [mensajes, setMensajes] = useState([])
  const [texto, setTexto] = useState('')
  const [enviando, setEnviando] = useState(false)
  const bottomRef = useRef(null)

  const cargarMensajes = async () => {
    try {
      const { data } = await api.get(`/tickets/${ticketId}/mensajes`)
      setMensajes(data)
      await api.put(`/tickets/${ticketId}/mensajes/leidos`)
    } catch {
      // silencioso — el ticket puede cerrarse mientras se pollea
    }
  }

  useEffect(() => {
    cargarMensajes()
    const interval = setInterval(cargarMensajes, 5000)
    return () => clearInterval(interval)
  }, [ticketId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [mensajes])

  const enviar = async (e) => {
    e.preventDefault()
    if (!texto.trim() || enviando) return
    setEnviando(true)
    try {
      await api.post(`/tickets/${ticketId}/mensajes`, { contenido: texto.trim() })
      setTexto('')
      await cargarMensajes()
    } catch (err) {
      console.error('Error al enviar mensaje:', err)
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="flex flex-col border rounded-xl overflow-hidden bg-gray-50" style={{ height: '380px' }}>
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {mensajes.length === 0 && (
          <p className="text-center text-gray-400 text-sm mt-10">
            {activo ? 'Sin mensajes aún. ¡Empezá la conversación!' : 'Sin mensajes.'}
          </p>
        )}
        {mensajes.map((m) => {
          const propio = m.id_usuario === usuario.id
          return (
            <div key={m.id} className={`flex ${propio ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-xs lg:max-w-sm px-3 py-2 rounded-2xl text-sm shadow-sm ${
                propio ? 'bg-indigo-600 text-white rounded-br-sm' : 'bg-white text-gray-800 border rounded-bl-sm'
              }`}>
                {!propio && (
                  <p className="text-xs font-semibold mb-1 text-indigo-600">{m.autor_nombre}</p>
                )}
                <p className="break-words">{m.contenido}</p>
                <p className={`text-xs mt-1 text-right ${propio ? 'text-indigo-200' : 'text-gray-400'}`}>
                  {new Date(m.fecha).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {activo ? (
        <form onSubmit={enviar} className="flex gap-2 p-3 border-t bg-white">
          <input
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder="Escribí un mensaje..."
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            disabled={enviando}
          />
          <button
            type="submit"
            disabled={enviando || !texto.trim()}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            Enviar
          </button>
        </form>
      ) : (
        <div className="p-3 border-t bg-gray-50 text-center text-xs text-gray-400">
          El chat está disponible solo cuando el ticket está en progreso.
        </div>
      )}
    </div>
  )
}
