import { useContext } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import AuthContext from '../context/auth'

function AdminRoute() {
  const { user } = useContext(AuthContext)
  const isAdmin = user?.vloge?.includes('administrator')

  return isAdmin ? <Outlet /> : <Navigate to="/archive" replace />
}

export default AdminRoute
