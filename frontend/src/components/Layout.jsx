import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Icon from './Icon'

const PORTAL_CONFIG = {
  admin: {
    accent: '#38bdf8',
    accentDim: '#0ea5e9',
    accentMuted: 'rgba(56,189,248,0.08)',
    accentGlow: 'rgba(56,189,248,0.15)',
    accentBorder: 'rgba(56,189,248,0.25)',
    label: 'Admin',
    navLinks: [
      { to: '/admin/dashboard', label: 'Dashboard', icon: 'grid' },
      { to: '/admin/usuarios', label: 'Usuarios', icon: 'users' },
    ],
  },
  empleado: {
    accent: '#fb923c',
    accentDim: '#ea580c',
    accentMuted: 'rgba(251,146,60,0.08)',
    accentGlow: 'rgba(251,146,60,0.15)',
    accentBorder: 'rgba(251,146,60,0.25)',
    label: 'Soporte',
    navLinks: [
      { to: '/empleado/tickets', label: 'Cola de tickets', icon: 'inbox' },
      { to: '/empleado/perfil', label: 'Mi perfil', icon: 'user' },
    ],
  },
  cliente: {
    accent: '#a78bfa',
    accentDim: '#8b5cf6',
    accentMuted: 'rgba(167,139,250,0.08)',
    accentGlow: 'rgba(167,139,250,0.15)',
    accentBorder: 'rgba(167,139,250,0.25)',
    label: 'Mi Portal',
    navLinks: [
      { to: '/cliente/tickets', label: 'Mis tickets', icon: 'ticket' },
      { to: '/cliente/nuevo-ticket', label: 'Nuevo ticket', icon: 'plus' },
    ],
  },
}

function getInitials(nombre = '') {
  return nombre
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('')
}

function Avatar({ nombre, size = 32 }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: 'linear-gradient(135deg, var(--accent-muted) 0%, var(--accent-border) 100%)',
        border: '1px solid var(--accent-border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        color: 'var(--accent)',
        fontSize: size * 0.35,
        fontWeight: 700,
        fontFamily: "'JetBrains Mono', monospace",
        letterSpacing: '-0.02em',
      }}
    >
      {getInitials(nombre)}
    </div>
  )
}

export default function Layout({ portal, children }) {
  const { usuario, logout } = useAuth()
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)

  const config = PORTAL_CONFIG[portal] ?? PORTAL_CONFIG.admin

  const cssVars = {
    '--accent': config.accent,
    '--accent-dim': config.accentDim,
    '--accent-muted': config.accentMuted,
    '--accent-glow': config.accentGlow,
    '--accent-border': config.accentBorder,
  }

  const isActive = (to) => location.pathname === to

  const SidebarContent = () => (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        background: 'var(--bg-base)',
        borderRight: '1px solid var(--border-default)',
      }}
    >
      {/* Logo */}
      <div style={{ padding: '20px 16px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <div
            style={{
              width: 30,
              height: 30,
              borderRadius: 8,
              background: 'var(--accent-muted)',
              border: '1px solid var(--accent-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent)',
              fontFamily: "'Syne', sans-serif",
              fontWeight: 800,
              fontSize: 14,
              flexShrink: 0,
            }}
          >
            H
          </div>
          <span
            style={{
              fontFamily: "'Syne', sans-serif",
              fontWeight: 700,
              fontSize: 16,
              color: 'var(--text-primary)',
              letterSpacing: '-0.02em',
            }}
          >
            HelpDesk
          </span>
        </div>

        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
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
          {config.label}
        </span>
      </div>

      <div style={{ height: 1, background: 'var(--border-default)', margin: '0 16px' }} />

      {/* Nav links */}
      <nav style={{ padding: '12px 8px', flex: 1, overflowY: 'auto' }}>
        {config.navLinks.map((link) => {
          const active = isActive(link.to)
          return (
            <Link
              key={link.to}
              to={link.to}
              onClick={() => setMobileOpen(false)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '9px 12px',
                borderRadius: 8,
                marginBottom: 2,
                fontSize: 14,
                fontWeight: active ? 600 : 400,
                textDecoration: 'none',
                color: active ? 'var(--accent)' : 'var(--text-secondary)',
                background: active ? 'var(--accent-muted)' : 'transparent',
                borderLeft: active ? '2px solid var(--accent)' : '2px solid transparent',
                transition: 'all 150ms ease',
              }}
              onMouseEnter={(e) => {
                if (!active) {
                  e.currentTarget.style.background = 'var(--bg-elevated)'
                  e.currentTarget.style.color = 'var(--text-primary)'
                }
              }}
              onMouseLeave={(e) => {
                if (!active) {
                  e.currentTarget.style.background = 'transparent'
                  e.currentTarget.style.color = 'var(--text-secondary)'
                }
              }}
            >
              <Icon name={link.icon} size={16} />
              {link.label}
            </Link>
          )
        })}
      </nav>

      {/* User section */}
      <div style={{ padding: '12px 12px 16px' }}>
        <div style={{ height: 1, background: 'var(--border-default)', marginBottom: 12 }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          <Avatar nombre={usuario?.nombre} size={32} />
          <div style={{ minWidth: 0, flex: 1 }}>
            <p
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: 'var(--text-primary)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {usuario?.nombre}
            </p>
            <p
              style={{
                fontSize: 11,
                color: 'var(--text-tertiary)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              {usuario?.email}
            </p>
          </div>
        </div>

        <button
          onClick={logout}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            width: '100%',
            padding: '8px 10px',
            borderRadius: 7,
            fontSize: 13,
            fontWeight: 500,
            color: 'var(--text-tertiary)',
            background: 'transparent',
            border: '1px solid transparent',
            cursor: 'pointer',
            transition: 'all 150ms ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = 'var(--danger)'
            e.currentTarget.style.background = 'rgba(244,63,94,0.06)'
            e.currentTarget.style.borderColor = 'rgba(244,63,94,0.15)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = 'var(--text-tertiary)'
            e.currentTarget.style.background = 'transparent'
            e.currentTarget.style.borderColor = 'transparent'
          }}
        >
          <Icon name="logout" size={15} />
          Cerrar sesión
        </button>
      </div>
    </div>
  )

  return (
    <div style={{ ...cssVars, display: 'flex', minHeight: '100vh', background: 'var(--bg-surface)' }}>
      {/* Desktop sidebar */}
      <aside
        className="hidden md:flex"
        style={{
          width: 220,
          flexShrink: 0,
          position: 'sticky',
          top: 0,
          height: '100vh',
        }}
      >
        <div style={{ width: '100%' }}>
          <SidebarContent />
        </div>
      </aside>

      {/* Mobile top bar */}
      <div
        className="flex md:hidden"
        style={{
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 16px',
          background: 'var(--bg-base)',
          borderBottom: '1px solid var(--border-default)',
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 40,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 7,
              background: 'var(--accent-muted)',
              border: '1px solid var(--accent-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent)',
              fontFamily: "'Syne', sans-serif",
              fontWeight: 800,
              fontSize: 13,
            }}
          >
            H
          </div>
          <span
            style={{
              fontFamily: "'Syne', sans-serif",
              fontWeight: 700,
              fontSize: 15,
              color: 'var(--text-primary)',
            }}
          >
            HelpDesk
          </span>
        </div>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          style={{ color: 'var(--text-secondary)', background: 'none', border: 'none', cursor: 'pointer' }}
        >
          <Icon name="menu" size={20} />
        </button>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <>
          <div
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.6)',
              zIndex: 45,
            }}
            onClick={() => setMobileOpen(false)}
          />
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              bottom: 0,
              width: 220,
              zIndex: 50,
            }}
            className="animate-slide-in-left"
          >
            <SidebarContent />
          </div>
        </>
      )}

      {/* Main content */}
      <main
        style={{ flex: 1, minWidth: 0, overflowX: 'hidden' }}
        className="pt-14 md:pt-0"
      >
        <div className="page-enter">{children}</div>
      </main>
    </div>
  )
}

export { Avatar, getInitials }
