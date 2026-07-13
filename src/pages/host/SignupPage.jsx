import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Button, Input, ErrorText } from '../../components/host/ui'

export default function SignupPage() {
  const { signup } = useAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  // Mirror the server's rules so the user hears about a problem before a round trip.
  // The server still re-validates — this is a convenience, not a security control.
  const validate = () => {
    if (form.name.trim().length < 2) return 'Name must be at least 2 characters.'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return 'Enter a valid email.'
    if (form.password.length < 8) return 'Password must be at least 8 characters.'
    if (form.password !== form.confirm) return 'Passwords do not match.'
    return null
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const problem = validate()
    if (problem) return setError(problem)

    setError('')
    setLoading(true)
    try {
      await signup(form.name.trim(), form.email.trim(), form.password)
      navigate('/host', { replace: true })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center overflow-y-auto bg-film-bg px-6">
      <form onSubmit={handleSubmit} className="w-full max-w-sm py-10">
        <h1 className="font-mono text-3xl font-bold text-film-cream">Create account</h1>
        <p className="mb-8 mt-1.5 font-mono text-[13px] text-film-muted">
          Start hosting unforgettable events
        </p>

        <div className="flex flex-col gap-3">
          <Input placeholder="Full name" value={form.name} onChange={set('name')} autoComplete="name" />
          <Input
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={set('email')}
            autoComplete="email"
          />
          <Input
            type="password"
            placeholder="Password (min 8 characters)"
            value={form.password}
            onChange={set('password')}
            autoComplete="new-password"
          />
          <Input
            type="password"
            placeholder="Confirm password"
            value={form.confirm}
            onChange={set('confirm')}
            autoComplete="new-password"
          />

          <ErrorText>{error}</ErrorText>

          <Button type="submit" disabled={loading}>
            {loading ? 'Creating…' : 'Create Account'}
          </Button>

          <p className="mt-2 text-center font-mono text-[13px] text-film-muted">
            Already have an account?{' '}
            <Link to="/host/login" className="text-film-cream underline">
              Sign in
            </Link>
          </p>
        </div>
      </form>
    </div>
  )
}
