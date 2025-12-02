import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import Button from '../../components/UI/Button'
import Card from '../../components/UI/Card'
import './Auth.css'

const Login = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { signIn } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const { error } = await signIn(email, password)
      if (error) throw error
      navigate('/')
    } catch (error) {
      setError(error.message || 'Failed to sign in')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-container">
      <Card>
        <div className="auth-header">
          <h1>MenoTrak</h1>
          <p>Sign in to your account</p>
        </div>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="your@email.com"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
            />
          </div>

          <Button type="submit" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </Button>
        </form>

        <div className="auth-footer">
          <p>
            Don't have an account? <Link to="/signup">Sign up</Link>
          </p>
        </div>
      </Card>
    </div>
  )
}

export default Login

