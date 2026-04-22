import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Layout from '../../components/Layout'
import StarRating from '../../components/StarRating'
import Icon from '../../components/Icon'
import api from '../../api/axios'

export default function ClienteFeedback() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [estrellas, setEstrellas] = useState(0)
  const [comentario, setComentario] = useState('')
  const [enviado, setEnviado] = useState(false)
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)

  const enviar = async (e) => {
    e.preventDefault()
    if (!estrellas) { setError('Por favor seleccioná una calificación'); return }
    setError('')
    setEnviando(true)
    try {
      await api.post(`/tickets/${id}/feedback`, {
        estrellas,
        comentario: comentario.trim() || null,
      })
      setEnviado(true)
    } catch (err) {
      setError(err.response?.data?.error || 'Error al enviar feedback')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <Layout portal="cliente">
      <div
        style={{
          minHeight: 'calc(100vh - 0px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '32px 24px',
        }}
      >
        <div
          style={{
            width: '100%',
            maxWidth: 440,
            animation: 'slideUp 0.3s cubic-bezier(0.16,1,0.3,1)',
          }}
        >
          {enviado ? (
            /* Success state */
            <div
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-default)',
                borderRadius: 20,
                padding: '48px 36px',
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 64,
                  height: 64,
                  borderRadius: '50%',
                  background: 'var(--success-muted)',
                  border: '1px solid rgba(16,185,129,0.25)',
                  color: 'var(--success)',
                  marginBottom: 20,
                  animation: 'scaleIn 0.35s cubic-bezier(0.34,1.56,0.64,1)',
                }}
              >
                <Icon name="check" size={28} />
              </div>
              <h1
                style={{
                  fontFamily: "'Syne', sans-serif",
                  fontWeight: 800,
                  fontSize: 22,
                  color: 'var(--text-primary)',
                  letterSpacing: '-0.02em',
                  marginBottom: 10,
                }}
              >
                ¡Gracias por tu feedback!
              </h1>
              <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 28 }}>
                Tu opinión nos ayuda a mejorar el servicio de soporte. El equipo lo agradece mucho.
              </p>
              <button
                onClick={() => navigate('/cliente/tickets')}
                className="btn-primary"
                style={{ width: '100%', justifyContent: 'center', height: 42 }}
              >
                Volver a mis tickets
              </button>
            </div>
          ) : (
            /* Rating form */
            <div
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-default)',
                borderRadius: 20,
                padding: '36px 32px',
              }}
            >
              <div style={{ textAlign: 'center', marginBottom: 28 }}>
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 52,
                    height: 52,
                    borderRadius: '50%',
                    background: 'rgba(251,191,36,0.08)',
                    border: '1px solid rgba(251,191,36,0.2)',
                    color: '#fbbf24',
                    marginBottom: 16,
                  }}
                >
                  <Icon name="star" size={24} />
                </div>
                <h1
                  style={{
                    fontFamily: "'Syne', sans-serif",
                    fontWeight: 700,
                    fontSize: 22,
                    color: 'var(--text-primary)',
                    letterSpacing: '-0.02em',
                    marginBottom: 6,
                  }}
                >
                  ¿Cómo fue la atención?
                </h1>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                  Calificá la experiencia en el ticket{' '}
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", color: 'var(--text-primary)' }}>
                    #{String(id).padStart(4, '0')}
                  </span>
                </p>
              </div>

              <form onSubmit={enviar} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'center', padding: '8px 0' }}>
                  <StarRating value={estrellas} onChange={setEstrellas} />
                </div>

                <div>
                  <label className="label">
                    Comentario{' '}
                    <span style={{ color: 'var(--text-tertiary)', fontWeight: 400 }}>(opcional)</span>
                  </label>
                  <textarea
                    value={comentario}
                    onChange={(e) => setComentario(e.target.value)}
                    className="textarea-base"
                    rows={3}
                    placeholder="¿Algo que quieras agregar sobre la atención recibida?"
                  />
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

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <button
                    type="submit"
                    disabled={enviando || estrellas === 0}
                    className="btn-primary"
                    style={{ width: '100%', justifyContent: 'center', height: 42, gap: 7 }}
                  >
                    {enviando ? (
                      <>
                        <div style={{ width: 12, height: 12, border: '2px solid rgba(9,9,15,0.3)', borderTopColor: '#09090f', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                        Enviando...
                      </>
                    ) : (
                      <>
                        <Icon name="send" size={14} />
                        Enviar feedback
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => navigate('/cliente/tickets')}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-tertiary)',
                      fontSize: 13,
                      cursor: 'pointer',
                      padding: '6px 0',
                      transition: 'color 120ms ease',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text-secondary)' }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-tertiary)' }}
                  >
                    Omitir por ahora
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </Layout>
  )
}
