import { useState, useEffect } from 'react'
import Layout from '../../components/Layout'
import Icon from '../../components/Icon'
import api from '../../api/axios'

function StatCard({ label, value, icon, color }) {
  return (
    <div
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-default)',
        borderRadius: 12,
        padding: '20px 24px',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 2,
          background: `linear-gradient(90deg, ${color}, transparent)`,
          opacity: 0.6,
        }}
      />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <p style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 500, letterSpacing: '0.03em', textTransform: 'uppercase' }}>
          {label}
        </p>
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            background: `${color}18`,
            border: `1px solid ${color}30`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color,
          }}
        >
          <Icon name={icon} size={15} />
        </div>
      </div>
      <p
        style={{
          fontFamily: "'Syne', sans-serif",
          fontWeight: 800,
          fontSize: 36,
          color: 'var(--text-primary)',
          lineHeight: 1,
          letterSpacing: '-0.04em',
        }}
      >
        {value ?? '—'}
      </p>
    </div>
  )
}

function StarBar({ rating, total = 5 }) {
  const pct = (rating / total) * 100
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
      <div
        style={{
          flex: 1,
          height: 4,
          background: 'var(--border-default)',
          borderRadius: 99,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${pct}%`,
            height: '100%',
            background: '#fbbf24',
            borderRadius: 99,
            transition: 'width 600ms ease',
          }}
        />
      </div>
      <span style={{ fontSize: 13, fontWeight: 700, color: '#fbbf24', minWidth: 28 }}>
        {Number(rating).toFixed(1)}
      </span>
    </div>
  )
}

function StatusBadge({ estado }) {
  const map = {
    abierto: 'badge badge-open',
    en_progreso: 'badge badge-progress',
    cerrado: 'badge badge-closed',
  }
  const labels = { abierto: 'Abierto', en_progreso: 'En progreso', cerrado: 'Cerrado' }
  return <span className={map[estado] ?? 'badge'}>{labels[estado] ?? estado}</span>
}

function TicketModal({ ticket, onClose, onCerrar }) {
  if (!ticket) return null
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 50,
        padding: 16,
        backdropFilter: 'blur(4px)',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-default)',
          borderRadius: 16,
          width: '100%',
          maxWidth: 540,
          maxHeight: '85vh',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          animation: 'scaleIn 0.2s cubic-bezier(0.16,1,0.3,1)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 24px 16px',
            borderBottom: '1px solid var(--border-default)',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: 12,
          }}
        >
          <div style={{ minWidth: 0 }}>
            <p style={{ fontSize: 12, color: 'var(--text-tertiary)', fontFamily: "'JetBrains Mono', monospace", marginBottom: 4 }}>
              #{String(ticket.id).padStart(4, '0')}
            </p>
            <h2
              style={{
                fontFamily: "'Syne', sans-serif",
                fontWeight: 700,
                fontSize: 18,
                color: 'var(--text-primary)',
                letterSpacing: '-0.02em',
              }}
            >
              {ticket.titulo}
            </h2>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-default)',
              borderRadius: 8,
              width: 32,
              height: 32,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            <Icon name="x" size={15} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '20px 24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{ticket.descripcion}</p>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
            {[
              { label: 'Estado', value: <StatusBadge estado={ticket.estado} /> },
              { label: 'Prioridad', value: ticket.prioridad },
              { label: 'Cliente', value: ticket.cliente_nombre },
              ...(ticket.empleado_nombre ? [{ label: 'Empleado', value: ticket.empleado_nombre }] : []),
            ].map(({ label, value }) => (
              <div key={label}>
                <p style={{ fontSize: 11, color: 'var(--text-tertiary)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</p>
                <p style={{ fontSize: 14, color: 'var(--text-primary)', fontWeight: 500 }}>{value}</p>
              </div>
            ))}
          </div>

          {ticket.mensajes?.length > 0 && (
            <div>
              <p style={{ fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Mensajes ({ticket.mensajes.length})
              </p>
              <div
                style={{
                  background: 'var(--bg-base)',
                  border: '1px solid var(--border-default)',
                  borderRadius: 10,
                  padding: 12,
                  maxHeight: 160,
                  overflowY: 'auto',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                }}
              >
                {ticket.mensajes.map((m) => (
                  <div key={m.id} style={{ fontSize: 13 }}>
                    <span style={{ color: 'var(--accent)', fontWeight: 600 }}>{m.autor_nombre}: </span>
                    <span style={{ color: 'var(--text-secondary)' }}>{m.contenido}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {ticket.feedback && (
            <div
              style={{
                background: 'rgba(251,191,36,0.05)',
                border: '1px solid rgba(251,191,36,0.15)',
                borderRadius: 10,
                padding: 14,
              }}
            >
              <p style={{ fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Feedback del cliente</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span style={{ color: '#fbbf24', fontSize: 18, letterSpacing: -2 }}>
                  {'★'.repeat(ticket.feedback.estrellas)}
                  <span style={{ color: 'var(--border-default)' }}>{'★'.repeat(5 - ticket.feedback.estrellas)}</span>
                </span>
                <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                  {ticket.feedback.estrellas}/5
                </span>
              </div>
              {ticket.feedback.comentario && (
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                  "{ticket.feedback.comentario}"
                </p>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {ticket.estado !== 'cerrado' && (
          <div style={{ padding: '14px 24px', borderTop: '1px solid var(--border-default)' }}>
            <button
              onClick={() => onCerrar(ticket.id)}
              className="btn-danger"
              style={{ width: '100%', justifyContent: 'center' }}
            >
              <Icon name="x" size={14} />
              Cerrar ticket manualmente
            </button>
          </div>
        )}
      </div>
    </div>
  )
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

  const statsCards = [
    {
      key: 'abierto',
      label: 'Abiertos',
      icon: 'inbox',
      color: '#fbbf24',
    },
    {
      key: 'en_progreso',
      label: 'En progreso',
      icon: 'chat',
      color: '#38bdf8',
    },
    {
      key: 'cerrado',
      label: 'Cerrados',
      icon: 'check',
      color: '#10b981',
    },
  ]

  return (
    <Layout portal="admin">
      <div style={{ padding: '28px 32px', maxWidth: 1100, margin: '0 auto' }}>
        {/* Page header */}
        <div style={{ marginBottom: 28 }}>
          <h1
            style={{
              fontFamily: "'Syne', sans-serif",
              fontWeight: 800,
              fontSize: 28,
              color: 'var(--text-primary)',
              letterSpacing: '-0.03em',
              marginBottom: 4,
            }}
          >
            Dashboard
          </h1>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
            Resumen general del sistema de soporte.
          </p>
        </div>

        {/* Stat cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
          {statsCards.map(({ key, label, icon, color }) => (
            <StatCard
              key={key}
              label={label}
              icon={icon}
              color={color}
              value={stats?.tickets_por_estado?.[key]}
            />
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.6fr', gap: 20, alignItems: 'start' }}>
          {/* Rating por empleado */}
          <div
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-default)',
              borderRadius: 12,
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                padding: '16px 20px',
                borderBottom: '1px solid var(--border-default)',
              }}
            >
              <h2 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
                Rating por empleado
              </h2>
            </div>
            <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              {stats?.rating_por_empleado?.length === 0 && (
                <p style={{ fontSize: 13, color: 'var(--text-tertiary)', textAlign: 'center', padding: '8px 0' }}>
                  No hay empleados registrados aún.
                </p>
              )}
              {stats?.rating_por_empleado?.map((r) => (
                <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {r.nombre}
                      </p>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                          padding: '1px 6px',
                          borderRadius: 99,
                          fontSize: 10,
                          fontWeight: 600,
                          border: `1px solid ${r.disponibilidad === 'disponible' ? 'rgba(16,185,129,0.3)' : 'rgba(251,191,36,0.3)'}`,
                          background: r.disponibilidad === 'disponible' ? 'rgba(16,185,129,0.1)' : 'rgba(251,191,36,0.1)',
                          color: r.disponibilidad === 'disponible' ? '#10b981' : '#fbbf24',
                          flexShrink: 0,
                        }}
                      >
                        <span style={{ width: 5, height: 5, borderRadius: '50%', background: r.disponibilidad === 'disponible' ? '#10b981' : '#fbbf24' }} />
                        {r.disponibilidad === 'disponible' ? 'Disponible' : 'Ocupado'}
                      </span>
                    </div>
                    {r.promedio != null ? (
                      <StarBar rating={r.promedio} />
                    ) : (
                      <p style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>Sin evaluaciones</p>
                    )}
                  </div>
                  <span style={{ fontSize: 11, color: 'var(--text-tertiary)', fontFamily: "'JetBrains Mono', monospace", whiteSpace: 'nowrap' }}>
                    {r.total} reseñas
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Tickets table */}
          <div
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-default)',
              borderRadius: 12,
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                padding: '14px 20px',
                borderBottom: '1px solid var(--border-default)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12,
              }}
            >
              <h2 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
                Tickets
                <span style={{ color: 'var(--text-tertiary)', fontFamily: "'JetBrains Mono', monospace", marginLeft: 6, fontSize: 12 }}>
                  ({tickets.length})
                </span>
              </h2>
              <select
                className="select-base"
                value={filtroEstado}
                onChange={(e) => { setFiltroEstado(e.target.value); cargarTickets(e.target.value) }}
                style={{ width: 'auto' }}
              >
                <option value="">Todos</option>
                <option value="abierto">Abiertos</option>
                <option value="en_progreso">En progreso</option>
                <option value="cerrado">Cerrados</option>
              </select>
            </div>

            <div style={{ overflowX: 'auto' }}>
              {tickets.length === 0 ? (
                <div style={{ padding: '32px 20px', textAlign: 'center' }}>
                  <Icon name="inbox" size={28} style={{ color: 'var(--text-tertiary)', margin: '0 auto 8px' }} />
                  <p style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>Sin tickets con este filtro.</p>
                </div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-default)' }}>
                      {['#', 'Título', 'Cliente', 'Empleado', 'Estado'].map((h) => (
                        <th
                          key={h}
                          style={{
                            padding: '10px 16px',
                            textAlign: 'left',
                            fontSize: 11,
                            fontWeight: 600,
                            color: 'var(--text-tertiary)',
                            textTransform: 'uppercase',
                            letterSpacing: '0.06em',
                            background: 'var(--bg-base)',
                          }}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {tickets.map((t) => (
                      <tr
                        key={t.id}
                        onClick={() => verDetalle(t.id)}
                        style={{
                          borderBottom: '1px solid var(--border-subtle)',
                          cursor: 'pointer',
                          transition: 'background 120ms ease',
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-elevated)' }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
                      >
                        <td style={{ padding: '11px 16px', fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: 'var(--text-tertiary)' }}>
                          #{String(t.id).padStart(4, '0')}
                        </td>
                        <td style={{ padding: '11px 16px', maxWidth: 180 }}>
                          <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {t.titulo}
                          </p>
                        </td>
                        <td style={{ padding: '11px 16px', fontSize: 13, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                          {t.cliente_nombre}
                        </td>
                        <td style={{ padding: '11px 16px', fontSize: 13, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                          {t.empleado_nombre ?? <span style={{ color: 'var(--text-tertiary)' }}>—</span>}
                        </td>
                        <td style={{ padding: '11px 16px' }}>
                          <StatusBadge estado={t.estado} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>

      <TicketModal
        ticket={ticketDetalle}
        onClose={() => setTicketDetalle(null)}
        onCerrar={cerrarTicket}
      />
    </Layout>
  )
}
