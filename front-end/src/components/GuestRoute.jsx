import { useContext } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import AuthContext from '../context/auth'

function GuestRoute() {
  const { user, loading } = useContext(AuthContext)

  if (loading) {
    return <div className="loading-screen">Nalagam …</div>
  }

  return user ? <Navigate to="/archive" replace /> : <Outlet />
}

export default GuestRoute
