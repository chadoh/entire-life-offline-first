import React from 'react'
import {
  useLoaderData,
  redirect,
  Outlet,
  NavLink,
} from 'react-router-dom'
import type { ActionFunction, LoaderFunction } from '@remix-run/router'
import NewChartForm from '../components/new-chart-form'
import { addLedger, getLedgers } from '../data'

export const loader: LoaderFunction = async (): Promise<string[]> => {
  return getLedgers()
}

export const action: ActionFunction = async ({ request }) => {
  const formData = await request.formData()
  const newLedger = Object.fromEntries(formData) as unknown as Parameters<typeof addLedger>[0]
  await addLedger(newLedger)
  return redirect(`/${newLedger.name}`)
}

function App() {
  const ledgers = useLoaderData() as Awaited<string[]>
  return (
    <>
      <nav>
        {ledgers.map(name => (
          <NavLink
            key={name}
            to={name}
            className={({ isActive, isPending }) =>
              isActive ? 'active' : isPending ? 'pending' : ''
            }
          >
            {name}
          </NavLink>
        ))}
      </nav>
      <NewChartForm ledgers={ledgers} />
      <Outlet />
    </>
  )
}

export const element = <App />