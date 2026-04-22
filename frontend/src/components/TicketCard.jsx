const ESTADO_COLORS = {
  abierto: 'bg-green-100 text-green-700',
  en_progreso: 'bg-yellow-100 text-yellow-700',
  cerrado: 'bg-gray-100 text-gray-600',
}

const PRIORIDAD_COLORS = {
  alta: 'text-red-600 font-bold',
  media: 'text-yellow-600 font-semibold',
  baja: 'text-green-600',
}

export default function TicketCard({ ticket, mensajesSinLeer = 0, onClick, accion }) {
  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-xl shadow-sm border border-gray-200 p-4 transition-shadow ${onClick ? 'cursor-pointer hover:shadow-md' : ''}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-800 truncate">{ticket.titulo}</p>
          <p className="text-xs text-gray-400 mt-0.5">
            #{ticket.id}
            {ticket.cliente_nombre && ` · ${ticket.cliente_nombre}`}
            {ticket.empleado_nombre && ` · Empleado: ${ticket.empleado_nombre}`}
          </p>
        </div>
        <span className={`text-xs px-2 py-1 rounded-full font-medium whitespace-nowrap flex-shrink-0 ${ESTADO_COLORS[ticket.estado]}`}>
          {ticket.estado.replace('_', ' ')}
        </span>
      </div>

      <div className="flex items-center justify-between mt-3">
        <span className={`text-xs ${PRIORIDAD_COLORS[ticket.prioridad]}`}>
          ▲ {ticket.prioridad}
        </span>
        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          {mensajesSinLeer > 0 && (
            <span className="bg-red-500 text-white text-xs rounded-full px-2 py-0.5 font-bold animate-pulse">
              {mensajesSinLeer} nuevo{mensajesSinLeer > 1 ? 's' : ''}
            </span>
          )}
          {accion}
        </div>
      </div>
    </div>
  )
}
