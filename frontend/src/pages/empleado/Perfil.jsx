import { useState, useEffect } from 'react'
import Layout from '../../components/Layout'
import Icon from '../../components/Icon'
import api from '../../api/axios'
import { useAuth } from '../../context/AuthContext'

const PRIORIDAD_COLOR = {
  alta: '#f43f5e',
  media: '#fbbf24',
  baja: '#10b981',
}

function MetricCard({ label, value, icon, color, subtitle }) {
  return (
    <div
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-default)',
        borderRadius: 12,
        padding: '20px 24px',
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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
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
          marginBottom: subtitle ? 4 : 0,
        }}
      >
        {value ?? '—'}
      </p>
      {subtitle && (
        <p style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{subtitle}</p>
      )}
    </div>
  )
}

export default function EmpleadoPerfil() {
  const { usuario, actualizarUsuario } = useAuth()
  const [datos, setDatos] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [toggling, setToggling] = useState(false)

  const cargar = async () => {
    try {
      const { data } = await api.get('/empleado/perfil')
      setDatos(data)
      actualizarUsuario({ disponibilidad: data.perfil.disponibilidad })
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => { cargar() }, [])

  const toggleDisponibilidad = async () => {
    if (toggling) return
    setToggling(true)
    const nueva = datos.perfil.disponibilidad === 'disponible' ? 'ocupado' : 'disponible'
    try {
      await api.put('/empleado/disponibilidad', { disponibilidad: nueva })
      setDatos((prev) => ({ ...prev, perfil: { ...prev.perfil, disponibilidad: nueva } }))
      actualizarUsuario({ disponibilidad: nueva })
    } finally {
      setToggling(false)
    }
  }

  if (cargando) {
    return (
      <Layout portal="empleado">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', flexDirection: 'column', gap: 12, color: 'var(--text-tertiary)' }}>
          <div style={{ width: 32, height: 32, border: '2px solid var(--border-default)', borderTopColor: '#fb923c', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          <p style={{ fontSize: 13 }}>Cargando perfil...</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </Layout>
    )
  }

  const { perfil, metricas, historial } = datos
  const disponible = perfil.disponibilidad === 'disponible'

  return (
    <Layout portal="empleado">
      <div style={{ padding: '28px 32px', maxWidth: 860, margin: '0 auto' }}>

        {/* Header */}
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
            Mi perfil
          </h1>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
            Tu información, métricas y estado de disponibilidad.
          </p>
        </div>

        {/* Profile card */}
        <div
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-default)',
            borderRadius: 12,
            padding: '24px',
            marginBottom: 20,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 20,
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {/* Avatar */}
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: '50%',
                background: 'var(--accent-muted)',
                border: '1px solid var(--accent-border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent)',
                fontFamily: "'JetBrains Mono', monospace",
                fontWeight: 700,
                fontSize: 20,
                flexShrink: 0,
              }}
            >
              {perfil.nombre.split(' ').slice(0, 2).map((w) => w[0]?.toUpperCase() ?? '').join('')}
            </div>

            <div>
              <p
                style={{
                  fontFamily: "'Syne', sans-serif",
                  fontWeight: 700,
                  fontSize: 20,
                  color: 'var(--text-primary)',
                  letterSpacing: '-0.02em',
                  marginBottom: 2,
                }}
              >
                {perfil.nombre}
              </p>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', fontFamily: "'JetBrains Mono', monospace" }}>
                {perfil.email}
              </p>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  marginTop: 6,
                  padding: '2px 8px',
                  borderRadius: 99,
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  background: 'var(--accent-muted)',
                  color: 'var(--accent)',
                  border: '1px solid var(--accent-border)',
                  fontFamily: "'JetBrains Mono', monospace",
                }}
              >
                {perfil.rol}
              </span>
            </div>
          </div>

          {/* Disponibilidad toggle */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
            <p style={{ fontSize: 11, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 500 }}>
              Estado
            </p>
            <button
              onClick={toggleDisponibilidad}
              disabled={toggling}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 16px',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 600,
                cursor: toggling ? 'not-allowed' : 'pointer',
                border: `1px solid ${disponible ? 'rgba(16,185,129,0.3)' : 'rgba(251,191,36,0.3)'}`,
                background: disponible ? 'rgba(16,185,129,0.1)' : 'rgba(251,191,36,0.1)',
                color: disponible ? '#10b981' : '#fbbf24',
                transition: 'all 200ms ease',
                opacity: toggling ? 0.6 : 1,
              }}
            >
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: disponible ? '#10b981' : '#fbbf24',
                  boxShadow: disponible ? '0 0 6px #10b981' : '0 0 6px #fbbf24',
                }}
              />
              {disponible ? 'Disponible' : 'Ocupado'}
            </button>
            <p style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
              Hacé clic para cambiar
            </p>
          </div>
        </div>

        {/* Metrics */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
          <MetricCard
            label="Tickets resueltos"
            value={metricas.tickets_resueltos}
            icon="check"
            color="#10b981"
          />
          <MetricCard
            label="Promedio de estrellas"
            value={metricas.promedio_estrellas !== null ? `${metricas.promedio_estrellas}★` : '—'}
            icon="star"
            color="#fbbf24"
            subtitle={metricas.promedio_estrellas !== null ? 'sobre 5 posibles' : 'Sin evaluaciones aún'}
          />
          <MetricCard
            label="En progreso ahora"
            value={metricas.tickets_en_progreso}
            icon="chat"
            color="#fb923c"
          />
        </div>

        {/* Historial */}
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
              display: 'flex',
              alignItems: 'center',
              gap: 10,
            }}
          >
            <h2 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
              Tickets cerrados
            </h2>
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
                background: 'rgba(16,185,129,0.12)',
                color: '#10b981',
                border: '1px solid rgba(16,185,129,0.2)',
              }}
            >
              {historial.length}
            </span>
          </div>

          {historial.length === 0 ? (
            <div style={{ padding: '32px 20px', textAlign: 'center' }}>
              <Icon name="inbox" size={28} style={{ color: 'var(--text-tertiary)', margin: '0 auto 8px' }} />
              <p style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>Todavía no cerraste ningún ticket.</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-default)' }}>
                    {['#', 'Título', 'Prioridad', 'Fecha cierre', 'Evaluación'].map((h) => (
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
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {historial.map((t) => (
                    <tr
                      key={t.id}
                      style={{ borderBottom: '1px solid var(--border-subtle)' }}
                    >
                      <td style={{ padding: '11px 16px', fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: 'var(--text-tertiary)', whiteSpace: 'nowrap' }}>
                        #{String(t.id).padStart(4, '0')}
                      </td>
                      <td style={{ padding: '11px 16px', maxWidth: 260 }}>
                        <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {t.titulo}
                        </p>
                      </td>
                      <td style={{ padding: '11px 16px' }}>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            padding: '2px 8px',
                            borderRadius: 99,
                            fontSize: 11,
                            fontWeight: 600,
                            letterSpacing: '0.04em',
                            background: `${PRIORIDAD_COLOR[t.prioridad]}15`,
                            color: PRIORIDAD_COLOR[t.prioridad],
                            border: `1px solid ${PRIORIDAD_COLOR[t.prioridad]}30`,
                          }}
                        >
                          {t.prioridad}
                        </span>
                      </td>
                      <td style={{ padding: '11px 16px', fontSize: 13, color: 'var(--text-secondary)', whiteSpace: 'nowrap', fontFamily: "'JetBrains Mono', monospace" }}>
                        {new Date(t.fecha_cierre).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                      </td>
                      <td style={{ padding: '11px 16px' }}>
                        {t.estrellas !== null ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <span style={{ color: '#fbbf24', fontSize: 14, letterSpacing: -1 }}>
                              {'★'.repeat(t.estrellas)}
                              <span style={{ color: 'var(--border-default)' }}>{'★'.repeat(5 - t.estrellas)}</span>
                            </span>
                            <span style={{ fontSize: 12, color: 'var(--text-tertiary)', fontFamily: "'JetBrains Mono', monospace" }}>
                              {t.estrellas}/5
                            </span>
                          </div>
                        ) : (
                          <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>Sin evaluar</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </Layout>
  )
}
