import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../../components/Layout'
import TicketCard from '../../components/TicketCard'
import Icon from '../../components/Icon'
import api from '../../api/axios'
import { useAuth } from '../../context/AuthContext'

function SectionHeader({ label, count, color }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
      <h2 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{label}</h2>
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          minWidth: 22,
          height: 22,
          padding: '0 7px',
          borderRadius: 99,
          fontSize: 11,
          fontWeight: 700,
          fontFamily: "'JetBrains Mono', monospace",
          background: `${color}18`,
          color,
          border: `1px solid ${color}30`,
        }}
      >
        {count}
      </span>
    </div>
  )
}

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
      <Layout portal="cliente">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', flexDirection: 'column', gap: 12, color: 'var(--text-tertiary)' }}>
          <div style={{ width: 32, height: 32, border: '2px solid var(--border-default)', borderTopColor: '#a78bfa', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </Layout>
    )
  }

  return (
    <Layout portal="cliente">
      <div style={{ padding: '28px 32px', maxWidth: 720, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 28 }}>
          <div>
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
              Mis tickets
            </h1>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
              Seguí el estado de tus solicitudes de soporte.
            </p>
          </div>
          <button
            onClick={() => navigate('/cliente/nuevo-ticket')}
            className="btn-primary"
            style={{ flexShrink: 0, gap: 7 }}
          >
            <Icon name="plus" size={15} />
            Nuevo ticket
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
          {/* Activos */}
          <section>
            <SectionHeader label="Activos" count={activos.length} color="#a78bfa" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {activos.length === 0 ? (
                <div
                  style={{
                    padding: '36px 20px',
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-default)',
                    borderRadius: 12,
                    textAlign: 'center',
                    color: 'var(--text-tertiary)',
                    fontSize: 13,
                  }}
                >
                  No tenés tickets activos.{' '}
                  <button
                    onClick={() => navigate('/cliente/nuevo-ticket')}
                    style={{ color: '#a78bfa', background: 'none', border: 'none', cursor: 'pointer', fontSize: 'inherit', textDecoration: 'underline' }}
                  >
                    Crear uno nuevo
                  </button>
                </div>
              ) : (
                activos.map((t) => (
                  <TicketCard
                    key={t.id}
                    ticket={t}
                    mensajesSinLeer={sinLeer[t.id] || 0}
                    onClick={t.estado === 'en_progreso' ? () => navigate(`/cliente/tickets/${t.id}`) : undefined}
                  />
                ))
              )}
            </div>
          </section>

          {/* Cerrados */}
          <section>
            <SectionHeader label="Cerrados" count={cerrados.length} color="var(--text-tertiary)" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {cerrados.length === 0 ? (
                <p style={{ fontSize: 13, color: 'var(--text-tertiary)', textAlign: 'center', padding: '8px 0' }}>
                  Sin tickets cerrados.
                </p>
              ) : (
                cerrados.map((t) => (
                  <TicketCard
                    key={t.id}
                    ticket={t}
                    accion={
                      <div style={{ display: 'flex', gap: 6 }} onClick={(e) => e.stopPropagation()}>
                        {!t.tiene_feedback && (
                          <button
                            onClick={() => navigate(`/cliente/feedback/${t.id}`)}
                            style={{
                              height: 30,
                              padding: '0 10px',
                              borderRadius: 7,
                              fontSize: 11,
                              fontWeight: 600,
                              background: 'rgba(251,191,36,0.1)',
                              color: '#fbbf24',
                              border: '1px solid rgba(251,191,36,0.2)',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 5,
                              transition: 'background 120ms ease',
                            }}
                          >
                            <Icon name="star" size={11} />
                            Feedback
                          </button>
                        )}
                        <button
                          onClick={(e) => reabrir(e, t.id)}
                          className="btn-secondary"
                          style={{ height: 30, padding: '0 10px', fontSize: 11 }}
                        >
                          Reabrir
                        </button>
                      </div>
                    }
                  />
                ))
              )}
            </div>
          </section>
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </Layout>
  )
}
