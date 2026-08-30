import { useContext, useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import AuthContext from '../context/auth'

function Navigation() {
  const { user, logout } = useContext(AuthContext)
  const [error, setError] = useState('')
  const [loggingOut, setLoggingOut] = useState(false)
  const navigate = useNavigate()
  const isAdmin = user.vloge?.includes('administrator')

  async function handleLogout() {
    setError('')
    setLoggingOut(true)

    try {
      await logout()
      navigate('/login')
    } catch (logoutError) {
      setError(logoutError.message)
    } finally {
      setLoggingOut(false)
    }
  }

  return (
    <header className="site-header">
      <div className="nav-content">
        <p className="brand">Taborniški arhiv</p>
        <nav className="nav-links" aria-label="Glavna navigacija">
          <NavLink className={navLinkClass} to="/archive">
            Arhiv
          </NavLink>
          <NavLink className={navLinkClass} to="/my-reports">
            Moja poročila
          </NavLink>
          {isAdmin && (
            <NavLink className={navLinkClass} to="/admin/reports">
              Upravljanje
            </NavLink>
          )}
        </nav>
        <div className="user-actions">
          <span className="user-name">
            {user.ime} {user.priimek}
          </span>
          <button
            className="logout-button"
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
          >
            {loggingOut ? 'Odjavljam …' : 'Odjava'}
          </button>
        </div>
        {error && <p className="inline-error">{error}</p>}
      </div>
    </header>
  )
}

function navLinkClass({ isActive }) {
  return isActive ? 'nav-link active' : 'nav-link'
}

export default Navigation
