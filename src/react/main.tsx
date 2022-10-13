import React from 'react'
import {
  createHashRouter,
  RouterProvider,
} from 'react-router-dom'
import ledgers from './routes/ledgers'
import errorElement from './routes/error'

const router = createHashRouter([
  {
    path: '/',
    errorElement,
    ...ledgers,
  }
])

export default function App() {
  return (
    <React.StrictMode>
      <RouterProvider router={router} />
    </React.StrictMode>
  )
}