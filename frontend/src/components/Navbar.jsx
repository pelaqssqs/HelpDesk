import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const LINKS_POR_ROL = {
  admin: [
    { to: '/admin/dashboard', label: 'Dashboard' },
    { to: '/admin/usuarios', label: 'Usuarios' },
  ],
  empleado: [{ to: '/empleado/tickets', label: 'Tickets' }],
  cliente: [
    { to: '/cliente/tickets', label: 'Mis Tickets' },
    { to: '/cliente/nuevo-ticket', label: 'Nuevo Ticket' },
  ],
}

export default function Navbar() {
  const { usuario, logout } = useAuth()

  return (
    <nav className="bg-indigo-700 text-white px-6 py-3 flex items-center justify-between shadow-md">
      <span className="font-bold text-lg tracking-wide">HelpDesk</span>
      <div className="flex items-center gap-6 text-sm">
        {(LINKS_POR_ROL[usuario?.rol] || []).map((l) => (
          <Link key={l.to} to={l.to} className="hover:underline opacity-90 hover:opacity-100">
            {l.label}
          </Link>
        ))}
        <span className="opacity-60 hidden sm:inline">|</span>
        <span className="opacity-80 text-xs hidden sm:inline">{usuario?.nombre}</span>
        <button
          onClick={logout}
          className="bg-white text-indigo-700 px-3 py-1 rounded font-semibold text-xs hover:bg-indigo-50 transition-colors"
        >
          Salir
        </button>
      </div>
    </nav>
  )
}
