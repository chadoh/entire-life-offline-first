import React from 'react'
import {
  createHashRouter,
  RouterProvider,
} from 'react-router-dom'
import * as root from './routes/root'
import ErrorPage from './routes/error-page'

const router = createHashRouter([
  {
    ...root,
    path: '/',
    errorElement: <ErrorPage />,
  }
])

export default function App() {
  return (
    <React.StrictMode>
      <RouterProvider router={router} />
    </React.StrictMode>
  )
}