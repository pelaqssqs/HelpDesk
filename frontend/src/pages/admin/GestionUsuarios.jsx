import { useState, useEffect } from 'react'
import Layout from '../../components/Layout'
import Icon from '../../components/Icon'
import api from '../../api/axios'

function getInitials(nombre = '') {
  return nombre.split(' ').slice(0, 2).map((w) => w[0]?.toUpperCase() ?? '').join('')
}

const ROL_CONFIG = {
  admin: { label: 'Admin', color: '#38bdf8' },
  empleado: { label: 'Empleado', color: '#fb923c' },
  cliente: { label: 'Cliente', color: '#a78bfa' },
}

export default function GestionUsuarios() {
  const [usuarios, setUsuarios] = useState([])
  const [form, setForm] = useState({ nombre: '', email: '', rol: 'empleado' })
  const [resultado, setResultado] = useState(null)
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(false)
  const [copiado, setCopiado] = useState(false)

  const cargar = async () => {
    const { data } = await api.get('/admin/usuarios')
    setUsuarios(data)
  }

  useEffect(() => { cargar() }, [])

  const crear = async (e) => {
    e.preventDefault()
    setError('')
    setResultado(null)
    setCargando(true)
    try {
      const { data } = await api.post('/admin/usuarios', form)
      setResultado(data)
      setForm({ nombre: '', email: '', rol: 'empleado' })
      cargar()
    } catch (err) {
      setError(err.response?.data?.error || 'Error al crear usuario')
    } finally {
      setCargando(false)
    }
  }

  const eliminar = async (id) => {
    if (!confirm('¿Eliminar este usuario? Esta acción no se puede deshacer.')) return
    try {
      await api.delete(`/admin/usuarios/${id}`)
      cargar()
    } catch (err) {
      alert(err.response?.data?.error || 'Error al eliminar')
    }
  }

  const copiar = () => {
    navigator.clipboard.writeText(resultado.password_temporal)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2000)
  }

  return (
    <Layout portal="admin">
      <div style={{ padding: '28px 32px', maxWidth: 900, margin: '0 auto' }}>
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
            Usuarios
          </h1>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
            Gestioná los accesos al sistema.
          </p>
        </div>

        {/* Create form */}
        <div
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-default)',
            borderRadius: 12,
            marginBottom: 20,
            overflow: 'hidden',
          }}
        >
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-default)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Icon name="userPlus" size={16} style={{ color: 'var(--text-secondary)' }} />
            <h2 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>Agregar usuario</h2>
          </div>

          <div style={{ padding: '20px' }}>
            <form onSubmit={crear}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 10, marginBottom: 10 }}>
                <div>
                  <label className="label">Nombre completo</label>
                  <input
                    placeholder="Juan Pérez"
                    value={form.nombre}
                    onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                    className="input-base"
                    required
                  />
                </div>
                <div>
                  <label className="label">Email</label>
                  <input
                    type="email"
                    placeholder="juan@empresa.com"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="input-base"
                    required
                  />
                </div>
                <div>
                  <label className="label">Rol</label>
                  <select
                    value={form.rol}
                    onChange={(e) => setForm({ ...form, rol: e.target.value })}
                    className="select-base"
                  >
                    <option value="empleado">Empleado</option>
                    <option value="cliente">Cliente</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={cargando}
                className="btn-primary"
                style={{ gap: 7 }}
              >
                {cargando ? (
                  <>
                    <div style={{ width: 12, height: 12, border: '2px solid rgba(9,9,15,0.3)', borderTopColor: '#09090f', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                    Creando...
                  </>
                ) : (
                  <>
                    <Icon name="plus" size={14} />
                    Crear usuario
                  </>
                )}
              </button>
            </form>

            {error && (
              <div
                style={{
                  marginTop: 12,
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

            {resultado && (
              <div
                style={{
                  marginTop: 14,
                  padding: '14px 16px',
                  background: 'var(--success-muted)',
                  border: '1px solid rgba(16,185,129,0.2)',
                  borderRadius: 10,
                  animation: 'slideUp 0.25s ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                  <Icon name="check" size={14} style={{ color: 'var(--success)' }} />
                  <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--success)' }}>
                    Usuario <strong>{resultado.usuario.nombre}</strong> creado correctamente.
                  </p>
                </div>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8 }}>
                  Contraseña temporal (copiala ahora):
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <code
                    style={{
                      flex: 1,
                      padding: '8px 12px',
                      background: 'var(--bg-base)',
                      border: '1px solid var(--border-default)',
                      borderRadius: 8,
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: 15,
                      letterSpacing: '0.15em',
                      color: 'var(--text-primary)',
                      userSelect: 'all',
                    }}
                  >
                    {resultado.password_temporal}
                  </code>
                  <button
                    onClick={copiar}
                    className="btn-secondary"
                    style={{ flexShrink: 0, gap: 6 }}
                  >
                    <Icon name={copiado ? 'check' : 'copy'} size={14} />
                    {copiado ? 'Copiado' : 'Copiar'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Users table */}
        <div
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-default)',
            borderRadius: 12,
            overflow: 'hidden',
          }}
        >
          <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border-default)' }}>
            <h2 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
              Usuarios registrados
              <span style={{ color: 'var(--text-tertiary)', fontFamily: "'JetBrains Mono', monospace", marginLeft: 6, fontSize: 12 }}>
                ({usuarios.length})
              </span>
            </h2>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-default)' }}>
                {['Usuario', 'Email', 'Rol', 'Estado', ''].map((h, i) => (
                  <th
                    key={i}
                    style={{
                      padding: '10px 20px',
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
              {usuarios.map((u) => {
                const rolCfg = ROL_CONFIG[u.rol] ?? { label: u.rol, color: 'var(--text-secondary)' }
                return (
                  <tr
                    key={u.id}
                    style={{
                      borderBottom: '1px solid var(--border-subtle)',
                      transition: 'background 120ms ease',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-elevated)' }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
                  >
                    <td style={{ padding: '12px 20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: '50%',
                            background: `${rolCfg.color}18`,
                            border: `1px solid ${rolCfg.color}30`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: rolCfg.color,
                            fontSize: 11,
                            fontWeight: 700,
                            fontFamily: "'JetBrains Mono', monospace",
                            flexShrink: 0,
                          }}
                        >
                          {getInitials(u.nombre)}
                        </div>
                        <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)' }}>
                          {u.nombre}
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: '12px 20px', fontSize: 13, color: 'var(--text-secondary)', fontFamily: "'JetBrains Mono', monospace" }}>
                      {u.email}
                    </td>
                    <td style={{ padding: '12px 20px' }}>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          padding: '2px 10px',
                          borderRadius: 99,
                          fontSize: 11,
                          fontWeight: 700,
                          letterSpacing: '0.04em',
                          background: `${rolCfg.color}18`,
                          color: rolCfg.color,
                          border: `1px solid ${rolCfg.color}30`,
                        }}
                      >
                        {rolCfg.label}
                      </span>
                    </td>
                    <td style={{ padding: '12px 20px' }}>
                      {u.debe_cambiar_password ? (
                        <span style={{ fontSize: 12, color: '#fbbf24', fontWeight: 500 }}>Primer login pendiente</span>
                      ) : (
                        <span style={{ fontSize: 12, color: 'var(--success)', fontWeight: 500 }}>Activo</span>
                      )}
                    </td>
                    <td style={{ padding: '12px 20px', textAlign: 'right' }}>
                      {u.rol !== 'admin' && (
                        <button
                          onClick={() => eliminar(u.id)}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: 'var(--text-tertiary)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 5,
                            fontSize: 12,
                            padding: '4px 8px',
                            borderRadius: 6,
                            transition: 'all 120ms ease',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.color = 'var(--danger)'
                            e.currentTarget.style.background = 'var(--danger-muted)'
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.color = 'var(--text-tertiary)'
                            e.currentTarget.style.background = 'none'
                          }}
                        >
                          <Icon name="trash" size={13} />
                          Eliminar
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </Layout>
  )
}
