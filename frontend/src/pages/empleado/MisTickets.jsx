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

export default function EmpleadoMisTickets() {
  const { usuario } = useAuth()
  const navigate = useNavigate()
  const [tickets, setTickets] = useState([])
  const [sinLeer, setSinLeer] = useState({})
  const [cargando, setCargando] = useState(true)
  const [tomando, setTomando] = useState(null)

  const cargar = async () => {
    try {
      const { data } = await api.get('/tickets')
      setTickets(data)
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
    setTomando(id)
    try {
      await api.put(`/tickets/${id}/tomar`)
      await cargar()
    } finally {
      setTomando(null)
    }
  }

  const abiertos = tickets.filter((t) => t.estado === 'abierto')
  const enProgreso = tickets.filter((t) => t.estado === 'en_progreso')

  if (cargando) {
    return (
      <Layout portal="empleado">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', flexDirection: 'column', gap: 12, color: 'var(--text-tertiary)' }}>
          <div style={{ width: 32, height: 32, border: '2px solid var(--border-default)', borderTopColor: '#fb923c', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          <p style={{ fontSize: 13 }}>Cargando tickets...</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </Layout>
    )
  }

  return (
    <Layout portal="empleado">
      <div style={{ padding: '28px 32px', maxWidth: 720, margin: '0 auto' }}>
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
            Cola de tickets
          </h1>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
            Tomá tickets disponibles y gestioná los que ya tenés.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
          {/* Disponibles */}
          <section>
            <SectionHeader label="Disponibles" count={abiertos.length} color="#fbbf24" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {abiertos.length === 0 ? (
                <div
                  style={{
                    padding: '28px 20px',
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-default)',
                    borderRadius: 12,
                    textAlign: 'center',
                    color: 'var(--text-tertiary)',
                    fontSize: 13,
                  }}
                >
                  No hay tickets disponibles en este momento.
                </div>
              ) : (
                abiertos.map((t) => (
                  <TicketCard
                    key={t.id}
                    ticket={t}
                    accion={
                      <button
                        onClick={(e) => tomar(e, t.id)}
                        disabled={tomando === t.id}
                        className="btn-primary"
                        style={{ height: 32, padding: '0 12px', fontSize: 12, gap: 5 }}
                      >
                        {tomando === t.id ? (
                          <div style={{ width: 10, height: 10, border: '2px solid rgba(9,9,15,0.3)', borderTopColor: '#09090f', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                        ) : (
                          <Icon name="plus" size={12} />
                        )}
                        Tomar
                      </button>
                    }
                  />
                ))
              )}
            </div>
          </section>

          {/* En progreso */}
          <section>
            <SectionHeader label="Mis tickets en progreso" count={enProgreso.length} color="#fb923c" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {enProgreso.length === 0 ? (
                <div
                  style={{
                    padding: '28px 20px',
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-default)',
                    borderRadius: 12,
                    textAlign: 'center',
                    color: 'var(--text-tertiary)',
                    fontSize: 13,
                  }}
                >
                  No tenés tickets asignados. Tomá uno de los disponibles.
                </div>
              ) : (
                enProgreso.map((t) => (
                  <TicketCard
                    key={t.id}
                    ticket={t}
                    mensajesSinLeer={sinLeer[t.id] || 0}
                    onClick={() => navigate(`/empleado/tickets/${t.id}`)}
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
