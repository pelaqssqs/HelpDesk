import { createContext, useContext, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'

const AuthContext = createContext(null)

function leerSesion() {
  try {
    const token = sessionStorage.getItem('token')
    const datosUsuario = sessionStorage.getItem('usuario')
    if (token && datosUsuario) return JSON.parse(datosUsuario)
  } catch {}
  return null
}

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(leerSesion)
  const navigate = useNavigate()

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password })
    sessionStorage.setItem('token', data.token)
    sessionStorage.setItem('usuario', JSON.stringify(data.usuario))
    setUsuario(data.usuario)

    if (data.usuario.debe_cambiar_password) {
      navigate('/cambiar-password')
      return
    }
    _redirigirSegunRol(data.usuario.rol)
  }

  const logout = () => {
    sessionStorage.removeItem('token')
    sessionStorage.removeItem('usuario')
    setUsuario(null)
    navigate('/login')
  }

  const actualizarUsuario = (datos) => {
    const actualizado = { ...usuario, ...datos }
    sessionStorage.setItem('usuario', JSON.stringify(actualizado))
    setUsuario(actualizado)
  }

  const _redirigirSegunRol = (rol) => {
    if (rol === 'admin') navigate('/admin/dashboard')
    else if (rol === 'empleado') navigate('/empleado/tickets')
    else navigate('/cliente/tickets')
  }

  return (
    <AuthContext.Provider value={{ usuario, login, logout, actualizarUsuario }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
