import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'
import Icon from '../components/Icon'

export default function CambiarPassword() {
  const { usuario, actualizarUsuario } = useAuth()
  const navigate = useNavigate()
  const [nueva, setNueva] = useState('')
  const [confirmar, setConfirmar] = useState('')
  const [error, setError] = useState('')
  const [ok, setOk] = useState(false)
  const [enviando, setEnviando] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (nueva !== confirmar) { setError('Las contraseñas no coinciden'); return }
    if (nueva.length < 6) { setError('La contraseña debe tener al menos 6 caracteres'); return }
    setEnviando(true)
    try {
      await api.post('/auth/cambiar-password', { nueva_password: nueva })
      actualizarUsuario({ debe_cambiar_password: false })
      setOk(true)
      setTimeout(() => {
        if (usuario.rol === 'admin') navigate('/admin/dashboard')
        else if (usuario.rol === 'empleado') navigate('/empleado/tickets')
        else navigate('/cliente/tickets')
      }, 1500)
    } catch (err) {
      setError(err.response?.data?.error || 'Error al cambiar la contraseña')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--bg-base)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
      }}
    >
      <div
        aria-hidden="true"
        style={{
          position: 'fixed',
          inset: 0,
          backgroundImage: 'radial-gradient(rgba(255,255,255,0.02) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
          pointerEvents: 'none',
        }}
      />

      <div
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: 380,
          animation: 'slideUp 0.3s cubic-bezier(0.16,1,0.3,1)',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 48,
              height: 48,
              borderRadius: 14,
              background: 'rgba(56,189,248,0.08)',
              border: '1px solid rgba(56,189,248,0.2)',
              marginBottom: 12,
              color: '#38bdf8',
            }}
          >
            <Icon name="lock" size={22} />
          </div>
          <h1
            style={{
              fontFamily: "'Syne', sans-serif",
              fontWeight: 700,
              fontSize: 20,
              color: 'var(--text-primary)',
              letterSpacing: '-0.02em',
              marginBottom: 6,
            }}
          >
            Configurá tu contraseña
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', maxWidth: 280, margin: '0 auto' }}>
            Es tu primer ingreso. Establecé una contraseña segura para continuar.
          </p>
        </div>

        <div
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-default)',
            borderRadius: 16,
            padding: 28,
            boxShadow: '0 8px 48px rgba(0,0,0,0.4)',
          }}
        >
          {ok ? (
            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 52,
                  height: 52,
                  borderRadius: '50%',
                  background: 'var(--success-muted)',
                  border: '1px solid rgba(16,185,129,0.2)',
                  color: 'var(--success)',
                  marginBottom: 16,
                  animation: 'scaleIn 0.3s cubic-bezier(0.16,1,0.3,1)',
                }}
              >
                <Icon name="check" size={24} />
              </div>
              <p style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>
                ¡Contraseña actualizada!
              </p>
              <p style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>Redirigiendo...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label className="label">Nueva contraseña</label>
                <input
                  type="password"
                  value={nueva}
                  onChange={(e) => setNueva(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  required
                  className="input-base"
                />
              </div>

              <div>
                <label className="label">Confirmar contraseña</label>
                <input
                  type="password"
                  value={confirmar}
                  onChange={(e) => setConfirmar(e.target.value)}
                  placeholder="Repetí la contraseña"
                  required
                  className="input-base"
                />
              </div>

              {error && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 8,
                    padding: '10px 12px',
                    background: 'var(--danger-muted)',
                    border: '1px solid rgba(244,63,94,0.2)',
                    borderRadius: 8,
                    color: 'var(--danger)',
                    fontSize: 13,
                  }}
                >
                  <Icon name="alertCircle" size={15} style={{ flexShrink: 0, marginTop: 1 }} />
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={enviando}
                className="btn-primary"
                style={{ width: '100%', height: 42, marginTop: 4, background: '#38bdf8' }}
              >
                {enviando ? 'Guardando...' : 'Confirmar contraseña'}
              </button>
            </form>
          )}
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
