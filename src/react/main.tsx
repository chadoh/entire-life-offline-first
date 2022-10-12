import React from 'react'
import {
  createHashRouter,
  RouterProvider,
} from 'react-router-dom'
import * as root from './routes/root'
import * as ledger from './routes/ledger'
import ErrorPage from './routes/error-page'

const router = createHashRouter([
  {
    ...root,
    path: '/',
    errorElement: <ErrorPage />,
    children: [
      {
        errorElement: <ErrorPage />,
        children: [
          {
            ...ledger,
            path: ':ledgerName',
          }
        ]
      }
    ]
  }
])

export default function App() {
  return (
    <React.StrictMode>
      <RouterProvider router={router} />
    </React.StrictMode>
  )
}