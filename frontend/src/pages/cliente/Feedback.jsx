import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Navbar from '../../components/Navbar'
import StarRating from '../../components/StarRating'
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
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-md mx-auto p-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center">
          {enviado ? (
            <>
              <div className="text-5xl mb-4">🎉</div>
              <h1 className="text-xl font-bold text-gray-800 mb-2">¡Gracias por tu feedback!</h1>
              <p className="text-gray-500 text-sm mb-6">
                Tu opinión nos ayuda a mejorar el servicio de soporte.
              </p>
              <button
                onClick={() => navigate('/cliente/tickets')}
                className="bg-indigo-600 text-white px-6 py-2 rounded-xl font-semibold hover:bg-indigo-700 transition-colors"
              >
                Volver a mis tickets
              </button>
            </>
          ) : (
            <>
              <h1 className="text-xl font-bold text-gray-800 mb-1">¿Cómo fue la atención?</h1>
              <p className="text-gray-500 text-sm mb-6">
                Calificá la experiencia con el equipo de soporte para el ticket #{id}.
              </p>

              <form onSubmit={enviar} className="space-y-5 text-left">
                <div className="flex justify-center">
                  <StarRating value={estrellas} onChange={setEstrellas} />
                </div>

                {estrellas > 0 && (
                  <p className="text-center text-sm text-gray-500">
                    {estrellas === 5 ? '¡Excelente!' : estrellas === 4 ? 'Muy bueno' : estrellas === 3 ? 'Regular' : estrellas === 2 ? 'Malo' : 'Muy malo'}
                  </p>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Comentario <span className="text-gray-400 font-normal">(opcional)</span>
                  </label>
                  <textarea
                    value={comentario}
                    onChange={(e) => setComentario(e.target.value)}
                    rows={3}
                    placeholder="¿Algo que quieras agregar sobre la atención recibida?"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                  />
                </div>

                {error && (
                  <p className="text-red-500 text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={enviando}
                  className="w-full bg-indigo-600 text-white py-2 rounded-xl font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                >
                  {enviando ? 'Enviando...' : 'Enviar Feedback'}
                </button>

                <button
                  type="button"
                  onClick={() => navigate('/cliente/tickets')}
                  className="w-full text-gray-400 text-sm hover:underline"
                >
                  Omitir por ahora
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
