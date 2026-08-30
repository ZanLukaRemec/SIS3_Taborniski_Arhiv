import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import apiRequest from '../api'

const initialForm = {
  ime: '',
  priimek: '',
  uporabnisko_ime: '',
  e_posta: '',
  geslo: '',
  ponovitev_gesla: '',
}

function RegisterPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState(initialForm)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  function handleChange(event) {
    setForm({ ...form, [event.target.name]: event.target.value })
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')

    if (form.geslo !== form.ponovitev_gesla) {
      setError('Gesli se ne ujemata')
      return
    }

    setSubmitting(true)

    try {
      await apiRequest('/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          ime: form.ime,
          priimek: form.priimek,
          uporabnisko_ime: form.uporabnisko_ime,
          e_posta: form.e_posta,
          geslo: form.geslo,
        }),
      })
      navigate('/login', {
        replace: true,
        state: { success: 'Registracija je uspela. Zdaj se lahko prijaviš.' },
      })
    } catch (registrationError) {
      setError(registrationError.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="auth-shell">
      <section className="page-panel">
        <p className="auth-title">Taborniški arhiv</p>
        <h1>Registracija</h1>

        {error && (
          <p className="message message-error" role="alert">
            {error}
          </p>
        )}

        <form className="auth-form" onSubmit={handleSubmit}>
          <label htmlFor="ime">Ime</label>
          <input
            id="ime"
            name="ime"
            type="text"
            autoComplete="given-name"
            value={form.ime}
            onChange={handleChange}
            required
          />

          <label htmlFor="priimek">Priimek</label>
          <input
            id="priimek"
            name="priimek"
            type="text"
            autoComplete="family-name"
            value={form.priimek}
            onChange={handleChange}
            required
          />

          <label htmlFor="uporabnisko_ime">Uporabniško ime</label>
          <input
            id="uporabnisko_ime"
            name="uporabnisko_ime"
            type="text"
            autoComplete="username"
            value={form.uporabnisko_ime}
            onChange={handleChange}
            required
          />

          <label htmlFor="e_posta">E-pošta</label>
          <input
            id="e_posta"
            name="e_posta"
            type="email"
            autoComplete="email"
            value={form.e_posta}
            onChange={handleChange}
            required
          />

          <label htmlFor="novo_geslo">Geslo</label>
          <input
            id="novo_geslo"
            name="geslo"
            type="password"
            autoComplete="new-password"
            minLength="6"
            value={form.geslo}
            onChange={handleChange}
            required
          />

          <label htmlFor="ponovitev_gesla">Ponovitev gesla</label>
          <input
            id="ponovitev_gesla"
            name="ponovitev_gesla"
            type="password"
            autoComplete="new-password"
            minLength="6"
            value={form.ponovitev_gesla}
            onChange={handleChange}
            required
          />

          <button type="submit" disabled={submitting}>
            {submitting ? 'Ustvarjam račun …' : 'Ustvari račun'}
          </button>
        </form>

        <p className="auth-switch">
          Že imaš račun? <Link to="/login">Prijava</Link>
        </p>
      </section>
    </main>
  )
}

export default RegisterPage
