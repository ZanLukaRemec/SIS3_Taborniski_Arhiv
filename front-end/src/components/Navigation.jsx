import { useContext } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import AuthContext from '../context/auth'

function Navigation() {
  const { user } = useContext(AuthContext)
  const navigate = useNavigate()
  const isAdmin = user.vloge?.includes('administrator')

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
            onClick={() => navigate('/logout')}
          >
            Odjava
          </button>
        </div>
      </div>
    </header>
  )
}

function navLinkClass({ isActive }) {
  return isActive ? 'nav-link active' : 'nav-link'
}

export default Navigation
