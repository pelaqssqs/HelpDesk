import { useState, useEffect, useRef } from 'react'
import api from '../api/axios'
import { useAuth } from '../context/AuthContext'
import Icon from './Icon'

function formatTime(dateStr) {
  return new Date(dateStr).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
}

export default function Chat({ ticketId, activo }) {
  const { usuario } = useAuth()
  const [mensajes, setMensajes] = useState([])
  const [texto, setTexto] = useState('')
  const [enviando, setEnviando] = useState(false)
  const bottomRef = useRef(null)
  const inputRef = useRef(null)

  const cargarMensajes = async () => {
    try {
      const { data } = await api.get(`/tickets/${ticketId}/mensajes`)
      setMensajes(data)
      await api.put(`/tickets/${ticketId}/mensajes/leidos`)
    } catch {
      // ticket puede cerrarse mientras se pollea
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
      inputRef.current?.focus()
    }
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: 400,
        background: 'var(--bg-base)',
        border: '1px solid var(--border-default)',
        borderRadius: 12,
        overflow: 'hidden',
      }}
    >
      {/* Messages area */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
        }}
      >
        {mensajes.length === 0 && (
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              color: 'var(--text-tertiary)',
            }}
          >
            <Icon name="chat" size={28} />
            <p style={{ fontSize: 13 }}>
              {activo ? 'Sin mensajes aún. ¡Empezá la conversación!' : 'Sin mensajes.'}
            </p>
          </div>
        )}

        {mensajes.map((m) => {
          const propio = m.id_usuario === usuario.id
          return (
            <div
              key={m.id}
              style={{
                display: 'flex',
                justifyContent: propio ? 'flex-end' : 'flex-start',
              }}
            >
              <div
                style={{
                  maxWidth: '72%',
                  padding: '8px 12px',
                  borderRadius: propio ? '12px 12px 3px 12px' : '12px 12px 12px 3px',
                  background: propio ? 'var(--accent)' : 'var(--bg-card)',
                  border: propio ? 'none' : '1px solid var(--border-default)',
                  color: propio ? '#09090f' : 'var(--text-primary)',
                }}
              >
                {!propio && (
                  <p
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      marginBottom: 3,
                      color: 'var(--accent)',
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                    }}
                  >
                    {m.autor_nombre}
                  </p>
                )}
                <p style={{ fontSize: 14, lineHeight: 1.5, wordBreak: 'break-word' }}>
                  {m.contenido}
                </p>
                <p
                  style={{
                    fontSize: 11,
                    marginTop: 4,
                    textAlign: 'right',
                    opacity: 0.6,
                    fontFamily: "'JetBrains Mono', monospace",
                  }}
                >
                  {formatTime(m.fecha)}
                </p>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input area */}
      {activo ? (
        <form
          onSubmit={enviar}
          style={{
            display: 'flex',
            gap: 8,
            padding: '10px 12px',
            borderTop: '1px solid var(--border-default)',
            background: 'var(--bg-card)',
          }}
        >
          <input
            ref={inputRef}
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder="Escribí un mensaje..."
            disabled={enviando}
            className="input-base"
            style={{ height: 38, fontSize: 14, flex: 1 }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                enviar(e)
              }
            }}
          />
          <button
            type="submit"
            disabled={enviando || !texto.trim()}
            className="btn-primary"
            style={{ padding: '0 14px', height: 38, flexShrink: 0 }}
          >
            <Icon name="send" size={15} />
          </button>
        </form>
      ) : (
        <div
          style={{
            padding: '12px 16px',
            borderTop: '1px solid var(--border-default)',
            background: 'var(--bg-card)',
            textAlign: 'center',
            fontSize: 12,
            color: 'var(--text-tertiary)',
          }}
        >
          El chat está disponible solo cuando el ticket está en progreso.
        </div>
      )}
    </div>
  )
}
