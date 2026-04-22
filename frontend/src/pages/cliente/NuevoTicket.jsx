import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../../components/Layout'
import Icon from '../../components/Icon'
import api from '../../api/axios'

const PRIORIDAD_OPTIONS = [
  { value: 'baja', label: 'Baja', description: 'No urgente, puede esperar', color: '#10b981', icon: 'flag' },
  { value: 'media', label: 'Media', description: 'Requiere atención pronto', color: '#fbbf24', icon: 'flag' },
  { value: 'alta', label: 'Alta', description: 'Bloquea mi trabajo', color: '#f43f5e', icon: 'alertCircle' },
]

export default function NuevoTicket() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ titulo: '', descripcion: '', prioridad: 'media' })
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setEnviando(true)
    try {
      await api.post('/tickets', form)
      navigate('/cliente/tickets')
    } catch (err) {
      setError(err.response?.data?.error || 'Error al crear el ticket')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <Layout portal="cliente">
      <div style={{ padding: '28px 32px', maxWidth: 580, margin: '0 auto' }}>
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

        <div style={{ marginBottom: 24 }}>
          <h1
            style={{
              fontFamily: "'Syne', sans-serif",
              fontWeight: 800,
              fontSize: 26,
              color: 'var(--text-primary)',
              letterSpacing: '-0.03em',
              marginBottom: 4,
            }}
          >
            Nuevo ticket
          </h1>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
            Describí tu problema y te vamos a ayudar.
          </p>
        </div>

        <div
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-default)',
            borderRadius: 14,
            padding: '28px 28px',
          }}
        >
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
            <div>
              <label className="label">Título del problema</label>
              <input
                value={form.titulo}
                onChange={(e) => setForm({ ...form, titulo: e.target.value })}
                className="input-base"
                placeholder="Ej: No puedo acceder a la plataforma"
                required
              />
            </div>

            <div>
              <label className="label">Descripción detallada</label>
              <textarea
                value={form.descripcion}
                onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                className="textarea-base"
                placeholder="Describí el problema con todo el detalle posible: qué pasó, cuándo, qué estabas haciendo..."
                rows={5}
                required
              />
            </div>

            <div>
              <label className="label" style={{ marginBottom: 10 }}>Prioridad</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                {PRIORIDAD_OPTIONS.map(({ value, label, description, color }) => {
                  const selected = form.prioridad === value
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setForm({ ...form, prioridad: value })}
                      style={{
                        padding: '14px 12px',
                        borderRadius: 10,
                        border: `1.5px solid ${selected ? color : 'var(--border-default)'}`,
                        background: selected ? `${color}12` : 'var(--bg-base)',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'all 150ms ease',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 4,
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span
                          style={{
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            background: color,
                            display: 'inline-block',
                            flexShrink: 0,
                          }}
                        />
                        <span
                          style={{
                            fontSize: 13,
                            fontWeight: 700,
                            color: selected ? color : 'var(--text-primary)',
                          }}
                        >
                          {label}
                        </span>
                      </div>
                      <p style={{ fontSize: 11, color: 'var(--text-tertiary)', lineHeight: 1.4, margin: 0, paddingLeft: 14 }}>
                        {description}
                      </p>
                    </button>
                  )
                })}
              </div>
            </div>

            {error && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '10px 12px',
                  background: 'var(--danger-muted)',
                  border: '1px solid rgba(244,63,94,0.2)',
                  borderRadius: 8,
                  color: 'var(--danger)',
                  fontSize: 13,
                }}
              >
                <Icon name="alertCircle" size={14} />
                {error}
              </div>
            )}

            <div style={{ display: 'flex', gap: 10, paddingTop: 4 }}>
              <button
                type="button"
                onClick={() => navigate('/cliente/tickets')}
                className="btn-secondary"
                style={{ flex: 1, justifyContent: 'center' }}
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={enviando}
                className="btn-primary"
                style={{ flex: 2, justifyContent: 'center', gap: 7 }}
              >
                {enviando ? (
                  <>
                    <div style={{ width: 12, height: 12, border: '2px solid rgba(9,9,15,0.3)', borderTopColor: '#09090f', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Icon name="send" size={14} />
                    Crear ticket
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </Layout>
  )
}
