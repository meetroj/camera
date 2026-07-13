import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { hostApi } from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // On load, ask the server who we are. The session is an httpOnly cookie, so
  // the browser can't read it — only the server can tell us if it's still valid.
  useEffect(() => {
    hostApi
      .me()
      .then(({ user }) => setUser(user))
      .catch(() => setUser(null)) // 401 just means "not signed in"
      .finally(() => setLoading(false))
  }, [])

  const login = useCallback(async (email, password) => {
    const { user } = await hostApi.login(email, password)
    setUser(user)
    return user
  }, [])

  const signup = useCallback(async (name, email, password) => {
    const { user } = await hostApi.signup(name, email, password)
    setUser(user)
    return user
  }, [])

  const logout = useCallback(async () => {
    await hostApi.logout().catch(() => {})
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, setUser, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
