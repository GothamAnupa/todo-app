import { createContext, useCallback, useEffect, useMemo, useState } from 'react'
import { authService } from '../services/authService'
import { setUnauthorizedHandler } from '../services/api'
import {
  clearAuthStorage,
  getStoredUser,
  getToken,
  setStoredUser,
  setToken,
} from '../utils/tokenStorage'

export const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]           = useState(getStoredUser)
  const [token, setTokenState]    = useState(getToken)
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState(null)

  const logout = useCallback(() => {
    clearAuthStorage()
    setUser(null)
    setTokenState(null)
    setError(null)
  }, [])

  const persistSession = useCallback((accessToken, profile) => {
    setToken(accessToken)
    setStoredUser(profile)
    setTokenState(accessToken)
    setUser(profile)
  }, [])

  const bootstrap = useCallback(async () => {
    const existingToken = getToken()
    if (!existingToken) {
      setLoading(false)
      return
    }
    try {
      const profile = await authService.getMe()
      setUser(profile)
      setStoredUser(profile)
    } catch {
      logout()
    } finally {
      setLoading(false)
    }
  }, [logout])

  useEffect(() => {
    bootstrap()
  }, [bootstrap])

  useEffect(() => {
    setUnauthorizedHandler(() => logout())
  }, [logout])

  // ✅ FIX: wrap login and register in useCallback so their references
  // stay stable across renders — previously they were plain async functions
  // recreated every render, which broke the useMemo deps and caused
  // infinite re-renders → blank screen.
  const login = useCallback(async (payload) => {
    setError(null)
    const data = await authService.login(payload)
    persistSession(data.access_token, data.user)
    return data
  }, [persistSession])

  const register = useCallback(async (payload) => {
    setError(null)
    await authService.register(payload)
    return login({ email: payload.email, password: payload.password })
  }, [login])

  const value = useMemo(
    () => ({
      user,
      token,
      loading,
      error,
      setError,
      isAuthenticated: Boolean(token && user),
      login,
      register,
      logout,
    }),
    [user, token, loading, error, login, register, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}