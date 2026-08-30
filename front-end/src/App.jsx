import {
  Navigate,
  RouterProvider,
  createBrowserRouter,
} from 'react-router-dom'
import AdminRoute from './components/AdminRoute'
import AppLayout from './components/AppLayout'
import ProtectedRoute from './components/ProtectedRoute'
import PagePlaceholder from './pages/PagePlaceholder'

const router = createBrowserRouter([
  {
    path: '/login',
    element: (
      <PagePlaceholder
        compact
        title="Prijava"
        description="Obrazec za prijavo bo dodan v naslednji fazi."
      />
    ),
  },
  {
    path: '/register',
    element: (
      <PagePlaceholder
        compact
        title="Registracija"
        description="Obrazec za ustvarjanje računa bo dodan v naslednji fazi."
      />
    ),
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { index: true, element: <Navigate to="/archive" replace /> },
          {
            path: '/archive',
            element: (
              <PagePlaceholder
                title="Arhiv"
                description="Hierarhični pregled oddanih poročil bo dodan v fazi arhiva."
              />
            ),
          },
          {
            path: '/my-reports',
            element: (
              <PagePlaceholder
                title="Moja poročila"
                description="Osnutki in oddana poročila bodo prikazani na tej strani."
              />
            ),
          },
          {
            path: '/reports/new',
            element: (
              <PagePlaceholder
                title="Novo poročilo"
                description="Tukaj bo tristopenjski obrazec za pripravo poročila."
              />
            ),
          },
          {
            path: '/reports/:id',
            element: (
              <PagePlaceholder
                title="Poročilo"
                description="Podrobnosti izbranega poročila bodo prikazane na tej strani."
              />
            ),
          },
          {
            path: '/reports/:id/edit',
            element: (
              <PagePlaceholder
                title="Urejanje poročila"
                description="Obstoječi osnutek se bo tukaj odprl v drugem koraku."
              />
            ),
          },
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
