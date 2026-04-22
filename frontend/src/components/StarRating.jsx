import { useState } from 'react'

const LABELS = ['', 'Muy malo', 'Malo', 'Regular', 'Muy bueno', 'Excelente']

export default function StarRating({ value, onChange, readonly = false }) {
  const [hover, setHover] = useState(0)
  const active = hover || value

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
      <div style={{ display: 'flex', gap: 6 }}>
        {[1, 2, 3, 4, 5].map((star) => {
          const filled = active >= star
          return (
            <button
              key={star}
              type="button"
              disabled={readonly}
              onClick={() => !readonly && onChange(star)}
              onMouseEnter={() => !readonly && setHover(star)}
              onMouseLeave={() => !readonly && setHover(0)}
              style={{
                background: 'none',
                border: 'none',
                cursor: readonly ? 'default' : 'pointer',
                padding: 4,
                color: filled ? '#fbbf24' : 'var(--border-default)',
                transform: !readonly && hover === star ? 'scale(1.2)' : 'scale(1)',
                transition: 'transform 120ms ease, color 120ms ease',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <svg
                width={36}
                height={36}
                viewBox="0 0 24 24"
                fill={filled ? 'currentColor' : 'none'}
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" />
              </svg>
            </button>
          )
        })}
      </div>
      {!readonly && active > 0 && (
        <p
          style={{
            fontSize: 13,
            color: 'var(--text-secondary)',
            height: 18,
            transition: 'opacity 150ms ease',
          }}
        >
          {LABELS[active]}
        </p>
      )}
    </div>
  )
}
