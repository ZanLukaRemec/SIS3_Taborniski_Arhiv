import {
  Navigate,
  RouterProvider,
  createBrowserRouter,
} from 'react-router-dom'
import AdminRoute from './components/AdminRoute'
import AppLayout from './components/AppLayout'
import GuestRoute from './components/GuestRoute'
import ProtectedRoute from './components/ProtectedRoute'
import AdminReportsPage from './pages/AdminReportsPage'
import ArchivePage from './pages/ArchivePage'
import LoginPage from './pages/LoginPage'
import LogoutPage from './pages/LogoutPage'
import MyReportsPage from './pages/MyReportsPage'
import RegisterPage from './pages/RegisterPage'
import ReportPage from './pages/ReportPage'
import ReportWizardPage from './pages/ReportWizardPage'

const router = createBrowserRouter([
  {
    element: <GuestRoute />,
    children: [
      { path: '/login', element: <LoginPage /> },
      { path: '/register', element: <RegisterPage /> },
    ],
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { index: true, element: <Navigate to="/archive" replace /> },
          { path: '/archive', element: <ArchivePage /> },
          { path: '/logout', element: <LogoutPage /> },
          { path: '/my-reports', element: <MyReportsPage /> },
          { path: '/reports/new', element: <ReportWizardPage /> },
          { path: '/reports/:id', element: <ReportPage /> },
          { path: '/reports/:id/edit', element: <ReportWizardPage /> },
          {
            element: <AdminRoute />,
            children: [
              { path: '/admin/reports', element: <AdminReportsPage /> },
            ],
          },
        ],
      },
    ],
  },
  { path: '*', element: <Navigate to="/archive" replace /> },
])

function App() {
  return <RouterProvider router={router} />
}

export default App
