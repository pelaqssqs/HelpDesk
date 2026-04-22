function StatusBadge({ estado }) {
  const map = {
    abierto: { label: 'Abierto', cls: 'badge badge-open' },
    en_progreso: { label: 'En progreso', cls: 'badge badge-progress' },
    cerrado: { label: 'Cerrado', cls: 'badge badge-closed' },
  }
  const cfg = map[estado] ?? { label: estado, cls: 'badge' }
  return <span className={cfg.cls}>{cfg.label}</span>
}

function PriorityIndicator({ prioridad }) {
  const map = {
    alta: { color: 'var(--danger)', label: 'Alta' },
    media: { color: 'var(--warning)', label: 'Media' },
    baja: { color: 'var(--success)', label: 'Baja' },
  }
  const cfg = map[prioridad] ?? { color: 'var(--text-tertiary)', label: prioridad }
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--text-tertiary)' }}>
      <span
        style={{
          display: 'inline-block',
          width: 6,
          height: 6,
          borderRadius: '50%',
          background: cfg.color,
          flexShrink: 0,
        }}
      />
      {cfg.label}
    </span>
  )
}

export default function TicketCard({ ticket, mensajesSinLeer = 0, onClick, accion }) {
  return (
    <div
      onClick={onClick}
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-default)',
        borderRadius: 12,
        padding: '14px 16px',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'border-color 180ms ease, background 180ms ease',
      }}
      onMouseEnter={(e) => {
        if (onClick) {
          e.currentTarget.style.borderColor = 'var(--accent-border)'
          e.currentTarget.style.background = 'var(--bg-elevated)'
        }
      }}
      onMouseLeave={(e) => {
        if (onClick) {
          e.currentTarget.style.borderColor = 'var(--border-default)'
          e.currentTarget.style.background = 'var(--bg-card)'
        }
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: 'var(--text-primary)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              marginBottom: 4,
            }}
          >
            {ticket.titulo}
          </p>
          <p style={{ fontSize: 12, color: 'var(--text-tertiary)', fontFamily: "'JetBrains Mono', monospace" }}>
            #{String(ticket.id).padStart(4, '0')}
            {ticket.cliente_nombre && (
              <span style={{ color: 'var(--text-tertiary)', fontFamily: 'inherit' }}>
                {' '}· {ticket.cliente_nombre}
              </span>
            )}
            {ticket.empleado_nombre && (
              <span style={{ color: 'var(--text-tertiary)', fontFamily: 'inherit' }}>
                {' '}· {ticket.empleado_nombre}
              </span>
            )}
          </p>
        </div>
        <StatusBadge estado={ticket.estado} />
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: 12,
        }}
      >
        <PriorityIndicator prioridad={ticket.prioridad} />

        <div
          style={{ display: 'flex', alignItems: 'center', gap: 8 }}
          onClick={(e) => e.stopPropagation()}
        >
          {mensajesSinLeer > 0 && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                minWidth: 20,
                height: 20,
                padding: '0 6px',
                borderRadius: 99,
                fontSize: 11,
                fontWeight: 700,
                background: 'var(--accent)',
                color: '#09090f',
                fontFamily: "'JetBrains Mono', monospace",
                animation: 'pulseSubtle 2s ease-in-out infinite',
              }}
            >
              {mensajesSinLeer}
            </span>
          )}
          {accion}
        </div>
      </div>
    </div>
  )
}
