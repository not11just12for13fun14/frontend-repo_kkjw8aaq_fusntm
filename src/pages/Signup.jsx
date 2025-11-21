import { useState } from 'react'
import { signup } from '../lib/api'
import { useNavigate, Link } from 'react-router-dom'

export default function Signup({ onAuthed }){
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const submit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const user = await signup(email, password)
      onAuthed(user)
      navigate('/')
    } catch(e){
      setError(e.message||'Sign up failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto bg-white border border-slate-200 rounded-lg p-6">
      <h1 className="text-xl font-semibold mb-4">Create account</h1>
      {error && <div className="mb-3 text-sm text-red-600">{error}</div>}
      <form onSubmit={submit} className="space-y-3">
        <div>
          <label className="block text-sm text-slate-600 mb-1">Email</label>
          <input type="email" required value={email} onChange={e=>setEmail(e.target.value)} className="w-full border rounded px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm text-slate-600 mb-1">Password</label>
          <input type="password" required minLength={8} value={password} onChange={e=>setPassword(e.target.value)} className="w-full border rounded px-3 py-2" />
        </div>
        <button disabled={loading} className="w-full px-3 py-2 rounded bg-slate-900 text-white">{loading? 'Creating…':'Sign up'}</button>
      </form>
      <div className="mt-3 text-sm text-slate-600">Already have an account? <Link className="text-slate-900 underline" to="/login">Log in</Link></div>
    </div>
  )
}
