import { useContext, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import AuthContext from '../context/auth'

function LoginPage() {
  const { login } = useContext(AuthContext)
  const location = useLocation()
  const navigate = useNavigate()
  const [form, setForm] = useState({ prijava: '', geslo: '' })
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  function handleChange(event) {
    setForm({ ...form, [event.target.name]: event.target.value })
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setSubmitting(true)

    try {
      await login(form)
      navigate('/archive', { replace: true })
    } catch (loginError) {
      setError(loginError.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="auth-shell">
      <section className="page-panel">
        <p className="auth-title">Taborniški arhiv</p>
        <h1>Prijava</h1>

        {location.state?.success && (
          <p className="message message-success" role="status">
            {location.state.success}
          </p>
        )}
        {error && (
          <p className="message message-error" role="alert">
            {error}
          </p>
        )}

        <form className="auth-form" onSubmit={handleSubmit}>
          <label htmlFor="prijava">Uporabniško ime ali e-pošta</label>
          <input
            id="prijava"
            name="prijava"
            type="text"
            autoComplete="username"
            value={form.prijava}
            onChange={handleChange}
            required
          />

          <label htmlFor="geslo">Geslo</label>
          <input
            id="geslo"
            name="geslo"
            type="password"
            autoComplete="current-password"
            value={form.geslo}
            onChange={handleChange}
            required
          />

          <button type="submit" disabled={submitting}>
            {submitting ? 'Prijavljam …' : 'Prijava'}
          </button>
        </form>

        <p className="auth-switch">
          Še nimaš računa? <Link to="/register">Registracija</Link>
        </p>
      </section>
    </main>
  )
}

export default LoginPage
