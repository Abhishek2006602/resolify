import { createContext, useContext, useState } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('resolify_token'))
  const [user,  setUser]  = useState(() => {
    try {
      const s = localStorage.getItem('resolify_user')
      return s ? JSON.parse(s) : null
    } catch { return null }
  })

  function login(tokenStr, userData) {
    localStorage.setItem('resolify_token', tokenStr)
    localStorage.setItem('resolify_user', JSON.stringify(userData))
    setToken(tokenStr)
    setUser(userData)
  }

  function logout() {
    localStorage.removeItem('resolify_token')
    localStorage.removeItem('resolify_user')
    setToken(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{
      token,
      user,
      login,
      logout,
      isAuthenticated: !!token && !!user,
      isAdmin: user?.role === 'admin',
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
