import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Layout from '../../components/Layout'
import Chat from '../../components/Chat'
import Icon from '../../components/Icon'
import api from '../../api/axios'

const PRIORIDAD_CONFIG = {
  alta: { color: 'var(--danger)', label: 'Alta' },
  media: { color: 'var(--warning)', label: 'Media' },
  baja: { color: 'var(--success)', label: 'Baja' },
}

export default function EmpleadoTicketDetalle() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [ticket, setTicket] = useState(null)
  const [editandoPrioridad, setEditandoPrioridad] = useState(false)
  const [nuevaPrioridad, setNuevaPrioridad] = useState('')
  const [guardando, setGuardando] = useState(false)

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
    if (!confirm('¿Cerrar este ticket? El cliente podrá dejar su feedback.')) return
    await api.put(`/tickets/${id}/cerrar`)
    navigate('/empleado/tickets')
  }

  const guardarPrioridad = async () => {
    setGuardando(true)
    try {
      await api.put(`/tickets/${id}/prioridad`, { prioridad: nuevaPrioridad })
      setEditandoPrioridad(false)
      cargar()
    } finally {
      setGuardando(false)
    }
  }

  if (!ticket) {
    return (
      <Layout portal="empleado">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', flexDirection: 'column', gap: 12, color: 'var(--text-tertiary)' }}>
          <div style={{ width: 32, height: 32, border: '2px solid var(--border-default)', borderTopColor: '#fb923c', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </Layout>
    )
  }

  const priCfg = PRIORIDAD_CONFIG[ticket.prioridad] ?? { color: 'var(--text-secondary)', label: ticket.prioridad }

  return (
    <Layout portal="empleado">
      <div style={{ padding: '28px 32px', maxWidth: 760, margin: '0 auto' }}>
        {/* Back */}
        <button
          onClick={() => navigate('/empleado/tickets')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 13,
            color: 'var(--text-secondary)',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            marginBottom: 20,
            padding: '4px 0',
            transition: 'color 120ms ease',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text-primary)' }}
          onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-secondary)' }}
        >
          <Icon name="arrowLeft" size={15} />
          Volver a la cola
        </button>

        {/* Ticket info */}
        <div
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-default)',
            borderRadius: 12,
            padding: '22px 24px',
            marginBottom: 16,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 14 }}>
            <div style={{ minWidth: 0 }}>
              <p style={{ fontSize: 12, color: 'var(--text-tertiary)', fontFamily: "'JetBrains Mono', monospace", marginBottom: 6 }}>
                #{String(ticket.id).padStart(4, '0')}
              </p>
              <h1
                style={{
                  fontFamily: "'Syne', sans-serif",
                  fontWeight: 700,
                  fontSize: 22,
                  color: 'var(--text-primary)',
                  letterSpacing: '-0.02em',
                }}
              >
                {ticket.titulo}
              </h1>
            </div>
            <span className="badge badge-progress" style={{ flexShrink: 0, marginTop: 20 }}>
              En progreso
            </span>
          </div>

          <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 16 }}>
            {ticket.descripcion}
          </p>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20, paddingBottom: 16, borderBottom: '1px solid var(--border-subtle)' }}>
            <div>
              <p style={{ fontSize: 11, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Cliente</p>
              <p style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 500 }}>{ticket.cliente_nombre}</p>
            </div>
            {ticket.ticket_origen_id && (
              <div>
                <p style={{ fontSize: 11, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Origen</p>
                <span
                  style={{
                    fontSize: 12,
                    color: '#fbbf24',
                    background: 'rgba(251,191,36,0.08)',
                    border: '1px solid rgba(251,191,36,0.2)',
                    borderRadius: 6,
                    padding: '2px 8px',
                    fontFamily: "'JetBrains Mono', monospace",
                  }}
                >
                  Reabierto · #{ticket.ticket_origen_id}
                </span>
              </div>
            )}
          </div>

          {/* Priority editor */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingTop: 14 }}>
            <p style={{ fontSize: 12, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Prioridad</p>
            {editandoPrioridad ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <select
                  value={nuevaPrioridad}
                  onChange={(e) => setNuevaPrioridad(e.target.value)}
                  className="select-base"
                  style={{ height: 32, fontSize: 13 }}
                >
                  <option value="baja">Baja</option>
                  <option value="media">Media</option>
                  <option value="alta">Alta</option>
                </select>
                <button
                  onClick={guardarPrioridad}
                  disabled={guardando}
                  className="btn-primary"
                  style={{ height: 32, padding: '0 12px', fontSize: 12 }}
                >
                  {guardando ? 'Guardando...' : 'Guardar'}
                </button>
                <button
                  onClick={() => { setEditandoPrioridad(false); setNuevaPrioridad(ticket.prioridad) }}
                  className="btn-secondary"
                  style={{ height: 32, padding: '0 10px', fontSize: 12 }}
                >
                  Cancelar
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: priCfg.color }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: priCfg.color, display: 'inline-block' }} />
                  {priCfg.label}
                </span>
                <button
                  onClick={() => setEditandoPrioridad(true)}
                  style={{
                    fontSize: 12,
                    color: 'var(--text-tertiary)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '2px 6px',
                    borderRadius: 4,
                    transition: 'color 120ms ease',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text-primary)' }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-tertiary)' }}
                >
                  Editar
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
          <button
            onClick={cerrar}
            className="btn-primary"
            style={{ flex: 1, justifyContent: 'center', gap: 7 }}
          >
            <Icon name="check" size={15} />
            Cerrar ticket
          </button>
          <button
            onClick={liberar}
            className="btn-secondary"
            style={{ flex: 1, justifyContent: 'center', gap: 7 }}
          >
            <Icon name="arrowLeft" size={15} />
            Liberar ticket
          </button>
        </div>

        {/* Chat */}
        <div
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-default)',
            borderRadius: 12,
            overflow: 'hidden',
          }}
        >
          <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border-default)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Icon name="chat" size={15} style={{ color: 'var(--text-secondary)' }} />
            <h2 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>Chat con el cliente</h2>
          </div>
          <div style={{ padding: 16 }}>
            <Chat ticketId={parseInt(id)} activo={true} />
          </div>
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </Layout>
  )
}
