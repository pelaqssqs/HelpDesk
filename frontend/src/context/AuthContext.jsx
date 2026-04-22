import { createContext, useContext, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null)
  const [cargando, setCargando] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    const token = localStorage.getItem('token')
    const datosUsuario = localStorage.getItem('usuario')
    if (token && datosUsuario) {
      setUsuario(JSON.parse(datosUsuario))
    }
    setCargando(false)
  }, [])

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password })
    localStorage.setItem('token', data.token)
    localStorage.setItem('usuario', JSON.stringify(data.usuario))
    setUsuario(data.usuario)

    if (data.usuario.debe_cambiar_password) {
      navigate('/cambiar-password')
      return
    }
    _redirigirSegunRol(data.usuario.rol)
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('usuario')
    setUsuario(null)
    navigate('/login')
  }

  const actualizarUsuario = (datos) => {
    const actualizado = { ...usuario, ...datos }
    localStorage.setItem('usuario', JSON.stringify(actualizado))
    setUsuario(actualizado)
  }

  const _redirigirSegunRol = (rol) => {
    if (rol === 'admin') navigate('/admin/dashboard')
    else if (rol === 'empleado') navigate('/empleado/tickets')
    else navigate('/cliente/tickets')
  }

  return (
    <AuthContext.Provider value={{ usuario, login, logout, actualizarUsuario, cargando }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
