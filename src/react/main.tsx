import React from 'react'
import {
  createHashRouter,
  RouterProvider,
} from 'react-router-dom'
import * as root from './routes/root'
import * as ledger from './routes/ledger'
import * as newLedger from './routes/new'
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
            ...newLedger,
            index: true
          },
          {
            ...ledger,
            path: ':ledgerName',
          },
          {
            ...newLedger,
            path: '/new'
          },
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