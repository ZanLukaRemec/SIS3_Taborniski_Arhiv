import { useContext, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AuthContext from '../context/auth'

function LogoutPage() {
  const { logout } = useContext(AuthContext)
  const navigate = useNavigate()
  const started = useRef(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (started.current) {
      return
    }

    started.current = true

    logout()
      .then(() => navigate('/login', { replace: true }))
      .catch((logoutError) => setError(logoutError.message))
  }, [logout, navigate])

  if (error) {
    return (
      <section className="page-panel">
        <p className="message message-error" role="alert">
          {error}
        </p>
        <button type="button" onClick={() => navigate('/archive')}>
          Nazaj v arhiv
        </button>
      </section>
    )
  }

  return <p className="loading-message">Odjavljam …</p>
}

export default LogoutPage
