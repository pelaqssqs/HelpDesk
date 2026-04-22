import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import Icon from '../components/Icon'

export default function Login() {
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setCargando(true)
    try {
      await login(email, password)
    } catch (err) {
      setError(err.response?.data?.error || 'Email o contraseña incorrectos')
    } finally {
      setCargando(false)
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
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Background atmosphere */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `
            radial-gradient(ellipse 60% 50% at 20% 60%, rgba(56,189,248,0.04) 0%, transparent 70%),
            radial-gradient(ellipse 60% 50% at 80% 30%, rgba(167,139,250,0.04) 0%, transparent 70%)
          `,
          pointerEvents: 'none',
        }}
      />
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: 'radial-gradient(rgba(255,255,255,0.025) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
          pointerEvents: 'none',
        }}
      />

      {/* Card */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: 400,
          animation: 'slideUp 0.35s cubic-bezier(0.16,1,0.3,1)',
        }}
      >
        {/* Wordmark */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 10,
              marginBottom: 8,
            }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: 'rgba(56,189,248,0.08)',
                border: '1px solid rgba(56,189,248,0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#38bdf8',
                fontFamily: "'Syne', sans-serif",
                fontWeight: 800,
                fontSize: 17,
              }}
            >
              H
            </div>
            <span
              style={{
                fontFamily: "'Syne', sans-serif",
                fontWeight: 700,
                fontSize: 22,
                color: 'var(--text-primary)',
                letterSpacing: '-0.03em',
              }}
            >
              HelpDesk Pro
            </span>
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>
            Sistema de gestión de soporte
          </p>
        </div>

        {/* Form card */}
        <div
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-default)',
            borderRadius: 16,
            padding: 32,
            boxShadow: '0 8px 48px rgba(0,0,0,0.4)',
          }}
        >
          {/* Inner top highlight */}
          <div
            aria-hidden="true"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: 1,
              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.04), transparent)',
              borderRadius: '16px 16px 0 0',
              pointerEvents: 'none',
            }}
          />

          <h2
            style={{
              fontFamily: "'Syne', sans-serif",
              fontWeight: 700,
              fontSize: 20,
              color: 'var(--text-primary)',
              marginBottom: 4,
              letterSpacing: '-0.02em',
            }}
          >
            Bienvenido
          </h2>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 28 }}>
            Ingresá con tu cuenta para continuar.
          </p>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label className="label">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@empresa.com"
                required
                autoComplete="email"
                className="input-base"
              />
            </div>

            <div>
              <label className="label">Contraseña</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  className="input-base"
                  style={{ paddingRight: 42 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: 12,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--text-tertiary)',
                    display: 'flex',
                    alignItems: 'center',
                    padding: 2,
                  }}
                >
                  <Icon name={showPassword ? 'eyeOff' : 'eye'} size={16} />
                </button>
              </div>
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
              disabled={cargando}
              className="btn-primary"
              style={{
                width: '100%',
                height: 42,
                marginTop: 4,
                fontSize: 15,
                background: '#38bdf8',
              }}
            >
              {cargando ? (
                <>
                  <div
                    style={{
                      width: 14,
                      height: 14,
                      border: '2px solid rgba(9,9,15,0.3)',
                      borderTopColor: '#09090f',
                      borderRadius: '50%',
                      animation: 'spin 0.7s linear infinite',
                    }}
                  />
                  Ingresando...
                </>
              ) : (
                'Iniciar sesión'
              )}
            </button>
          </form>
        </div>

        <p
          style={{
            textAlign: 'center',
            marginTop: 20,
            fontSize: 12,
            color: 'var(--text-tertiary)',
            fontFamily: "'JetBrains Mono', monospace",
          }}
        >
          HelpDesk Pro · v2.0
        </p>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}
