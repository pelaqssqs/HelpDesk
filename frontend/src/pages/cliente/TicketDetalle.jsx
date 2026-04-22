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
      <Layout portal="cliente">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', flexDirection: 'column', gap: 12, color: 'var(--text-tertiary)' }}>
          <div style={{ width: 32, height: 32, border: '2px solid var(--border-default)', borderTopColor: '#a78bfa', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </Layout>
    )
  }

  const priCfg = PRIORIDAD_CONFIG[ticket.prioridad] ?? { color: 'var(--text-secondary)', label: ticket.prioridad }

  return (
    <Layout portal="cliente">
      <div style={{ padding: '28px 32px', maxWidth: 760, margin: '0 auto' }}>
        {/* Back */}
        <button
          onClick={() => navigate('/cliente/tickets')}
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
          Volver a mis tickets
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
              marginBottom: 12,
            }}
          >
            {ticket.titulo}
          </h1>

          <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 18 }}>
            {ticket.descripcion}
          </p>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20, paddingTop: 16, borderTop: '1px solid var(--border-subtle)' }}>
            <div>
              <p style={{ fontSize: 11, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Prioridad</p>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: priCfg.color }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: priCfg.color, display: 'inline-block' }} />
                {priCfg.label}
              </span>
            </div>

            <div>
              <p style={{ fontSize: 11, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Agente asignado</p>
              <p style={{ fontSize: 13, color: ticket.empleado_nombre ? 'var(--text-primary)' : 'var(--text-tertiary)', fontWeight: 500 }}>
                {ticket.empleado_nombre || 'Esperando asignación...'}
              </p>
            </div>

            {ticket.es_reabierto && (
              <div>
                <p style={{ fontSize: 11, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Ticket origen</p>
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
            <h2 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>Chat con soporte</h2>
            {ticket.estado !== 'en_progreso' && (
              <span
                style={{
                  marginLeft: 'auto',
                  fontSize: 11,
                  color: 'var(--text-tertiary)',
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border-default)',
                  borderRadius: 6,
                  padding: '2px 8px',
                }}
              >
                Solo disponible cuando está en progreso
              </span>
            )}
          </div>
          <div style={{ padding: 16 }}>
            <Chat ticketId={parseInt(id)} activo={ticket.estado === 'en_progreso'} />
          </div>
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </Layout>
  )
}
