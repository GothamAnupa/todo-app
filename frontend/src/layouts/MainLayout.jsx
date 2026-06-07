import { Link, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export default function MainLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="min-h-screen bg-[#F7F8FA]">
      {/* Sticky Header */}
      <header className="sticky top-0 z-50 border-b border-[#E5E7EB] bg-white shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#5B5BD6]">
              <svg
                className="h-6 w-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                />
              </svg>
            </div>
            <span className="hidden text-xl font-600 text-[#111827] sm:inline">Tasks</span>
          </Link>

          {/* Right Section */}
          <nav className="flex items-center gap-4 sm:gap-6">
            {user ? (
              <>
                {/* User Avatar Chip */}
                <div className="hidden items-center gap-2 rounded-full bg-[#F3F4F6] px-3 py-2 sm:flex">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#5B5BD6] text-xs font-600 text-white">
                    {user.username?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <span className="text-sm font-500 text-[#6B7280]">{user.username}</span>
                </div>
              </>
            ) : null}

            {/* Logout Button */}
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-lg px-4 py-2 text-sm font-500 text-[#6B7280] hover:bg-[#F3F4F6] hover:text-[#111827]"
              title="Sign out"
            >
              Sign out
            </button>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Outlet />
      </main>
    </div>
  )
}
