import { Routes, Route, Navigate, Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import Dashboard from './pages/Dashboard'
import PersonDetail from './pages/PersonDetail'
import Login from './pages/Login'
import Signup from './pages/Signup'
import { getMe, setAuthToken, clearAuthToken } from './lib/api'

function Layout({ children, onLogout, user }) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 font-semibold">
            <span className="inline-block w-6 h-6 bg-gradient-to-br from-blue-500 to-indigo-600 rounded"></span>
            WeightTrack
          </Link>
          <div className="flex items-center gap-4">
            {user ? (
              <>
                <span className="text-sm text-slate-600">{user.email}</span>
                <button onClick={onLogout} className="px-3 py-1.5 rounded bg-slate-900 text-white text-sm hover:bg-slate-700">Log out</button>
              </>
            ) : (
              <div className="flex items-center gap-3 text-sm">
                <Link to="/login" className="px-3 py-1.5 rounded hover:bg-slate-100">Log in</Link>
                <Link to="/signup" className="px-3 py-1.5 rounded bg-slate-900 text-white hover:bg-slate-700">Sign up</Link>
              </div>
            )}
          </div>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-4 py-6">{children}</main>
      <footer className="border-t border-slate-200 py-6 text-center text-xs text-slate-500">Built with Flames Blue</footer>
    </div>
  )
}

function ProtectedRoute({ children, authed }) {
  if (!authed) return <Navigate to="/login" replace />
  return children
}

function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      setLoading(false)
      return
    }
    setAuthToken(token)
    getMe().then(u => setUser(u)).catch(() => clearAuthToken()).finally(() => setLoading(false))
  }, [])

  const handleLogout = () => {
    clearAuthToken()
    setUser(null)
  }

  if (loading) {
    return <div className="min-h-screen grid place-items-center text-slate-600">Loading…</div>
  }

  return (
    <Layout onLogout={handleLogout} user={user}>
      <Routes>
        <Route path="/" element={<ProtectedRoute authed={!!user}><Dashboard user={user} /></ProtectedRoute>} />
        <Route path="/person/:id" element={<ProtectedRoute authed={!!user}><PersonDetail /></ProtectedRoute>} />
        <Route path="/login" element={<Login onAuthed={setUser} />} />
        <Route path="/signup" element={<Signup onAuthed={setUser} />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  )
}

export default App
