import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Button, Input, ErrorText } from '../../components/host/ui'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email || !password) return setError('Fill in both fields.')

    setError('')
    setLoading(true)
    try {
      await login(email.trim(), password)
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
        <div className="mb-10 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-film-gold/30 bg-film-gold/10 text-3xl">
            📷
          </div>
          <h1 className="font-mono text-4xl font-bold tracking-[0.2em] text-film-cream">POV</h1>
          <p className="mt-2 font-mono text-[13px] text-film-muted">
            Your event, everyone&apos;s perspective
          </p>
        </div>

        <div className="flex flex-col gap-3.5">
          <Input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />
          <Input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />

          <ErrorText>{error}</ErrorText>

          <Button type="submit" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign In'}
          </Button>

          <p className="mt-2 text-center font-mono text-[13px] text-film-muted">
            Don&apos;t have an account?{' '}
            <Link to="/host/signup" className="text-film-cream underline">
              Sign up
            </Link>
          </p>
        </div>
      </form>
    </div>
  )
}
