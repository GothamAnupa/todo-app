import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export default function RegisterPage() {
  const navigate = useNavigate()
  const { register, error, setError } = useAuth()

  const [form, setForm] = useState({
    email: '',
    username: '',
    password: '',
  })
  const [submitting, setSubmitting] = useState(false)

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
    setError(null)
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSubmitting(true)
    setError(null)

    try {
      await register(form)
      navigate('/', { replace: true })
    } catch (err) {
      setError(err.message ?? 'Registration failed')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F7F8FA] px-4">
      <div className="w-full max-w-md space-y-6">
        {/* Logo */}
        <div className="flex justify-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#5B5BD6]">
            <svg className="h-7 w-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
        </div>

        {/* Card */}
        <div className="rounded-lg border border-[#E5E7EB] bg-white p-8 shadow-sm">
          <h1 className="text-2xl font-600 text-[#111827]">Create account</h1>
          <p className="mt-2 text-sm text-[#6B7280]">Register to manage your own tasks.</p>

          {/* Error Alert */}
          {error && (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-500 text-red-800" role="alert">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            {/* Email */}
            <label className="block">
              <span className="text-sm font-500 text-[#111827]">Email</span>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                required
                autoComplete="email"
                className="mt-2 w-full rounded-lg border border-[#E5E7EB] px-3 py-2.5 text-sm outline-none focus:border-[#5B5BD6] focus:ring-2 focus:ring-[#5B5BD6]/10"
              />
            </label>

            {/* Username */}
            <label className="block">
              <span className="text-sm font-500 text-[#111827]">Username</span>
              <input
                name="username"
                value={form.username}
                onChange={handleChange}
                required
                minLength={3}
                maxLength={50}
                pattern="^[a-zA-Z0-9_]+$"
                autoComplete="username"
                className="mt-2 w-full rounded-lg border border-[#E5E7EB] px-3 py-2.5 text-sm outline-none focus:border-[#5B5BD6] focus:ring-2 focus:ring-[#5B5BD6]/10"
              />
              <p className="mt-1 text-xs text-[#6B7280]">Letters, numbers, and underscores only.</p>
            </label>

            {/* Password */}
            <label className="block">
              <span className="text-sm font-500 text-[#111827]">Password</span>
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                required
                minLength={8}
                autoComplete="new-password"
                className="mt-2 w-full rounded-lg border border-[#E5E7EB] px-3 py-2.5 text-sm outline-none focus:border-[#5B5BD6] focus:ring-2 focus:ring-[#5B5BD6]/10"
              />
            </label>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-lg bg-[#5B5BD6] px-4 py-2.5 text-sm font-600 text-white hover:bg-[#4F4FCC] disabled:opacity-60 transition"
            >
              {submitting ? 'Creating account...' : 'Register'}
            </button>
          </form>

          {/* Sign In Link */}
          <p className="mt-6 text-center text-sm text-[#6B7280]">
            Already registered?{' '}
            <Link to="/login" className="font-600 text-[#5B5BD6] hover:text-[#4F4FCC]">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
