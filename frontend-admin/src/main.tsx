import React from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import './globals.css'
import App from './App'
import AdminCitiesPage from './pages/AdminCitiesPage'
import AdminTariffsPage from './pages/AdminTariffsPage'
import AdminLoginPage from './pages/AdminLoginPage'
import AdminOrdersPage from './pages/AdminOrdersPage'
import ProtectedRoute from './shared/ProtectedRoute'

const router = createBrowserRouter([
  {
    path: '/login',
    element: <AdminLoginPage />,
  },
  {
    path: '/',
    element: <ProtectedRoute />,
    children: [
      {
        element: <App />,
        children: [
          { index: true, element: <Navigate to="/orders" replace /> },
          { path: 'orders', element: <AdminOrdersPage /> },
          { path: 'cities', element: <AdminCitiesPage /> },
          { path: 'tariffs', element: <AdminTariffsPage /> },
        ],
      },
    ],
  },
])

const queryClient = new QueryClient()

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </React.StrictMode>
)

