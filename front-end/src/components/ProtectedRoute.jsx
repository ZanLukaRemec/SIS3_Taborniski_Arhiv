import { useContext } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import AuthContext from '../context/auth'

function ProtectedRoute() {
  const { user, loading } = useContext(AuthContext)

  if (loading) {
    return <div className="loading-screen">Nalagam …</div>
  }

  return user ? <Outlet /> : <Navigate to="/login" replace />
}

export default ProtectedRoute
