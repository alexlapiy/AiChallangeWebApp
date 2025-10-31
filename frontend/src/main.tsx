import React from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import App from './App'
import OrderPage from './pages/OrderPage'
import OrdersPage from './pages/OrdersPage'
import AdminCitiesPage from './pages/AdminCitiesPage'
import AdminTariffsPage from './pages/AdminTariffsPage'

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <OrderPage /> },
      { path: '/orders', element: <OrdersPage /> },
      { path: '/admin/cities', element: <AdminCitiesPage /> },
      { path: '/admin/tariffs', element: <AdminTariffsPage /> },
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


