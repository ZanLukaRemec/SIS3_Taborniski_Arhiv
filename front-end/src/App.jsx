import {
  Navigate,
  RouterProvider,
  createBrowserRouter,
} from 'react-router-dom'
import AdminRoute from './components/AdminRoute'
import AppLayout from './components/AppLayout'
import GuestRoute from './components/GuestRoute'
import ProtectedRoute from './components/ProtectedRoute'
import ArchivePage from './pages/ArchivePage'
import LoginPage from './pages/LoginPage'
import LogoutPage from './pages/LogoutPage'
import MyReportsPage from './pages/MyReportsPage'
import PagePlaceholder from './pages/PagePlaceholder'
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
              {
                path: '/admin/reports',
                element: (
                  <PagePlaceholder
                    title="Upravljanje"
                    description="Administratorska dejanja bodo dodana v svoji fazi."
                  />
                ),
              },
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
