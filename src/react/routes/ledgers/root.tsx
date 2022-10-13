import React from 'react'
import {
  useLoaderData,
  Outlet,
  NavLink,
} from 'react-router-dom'
import type { LoaderFunction } from '@remix-run/router'
import { getLedgers } from '../../data'

export const loader: LoaderFunction = async (): Promise<string[]> => {
  return getLedgers()
}

function App() {
  const ledgers = useLoaderData() as Awaited<string[]>
  return (
    <>
      {ledgers.length > 0 && (
        <nav>
          {ledgers.map(name => (
            <NavLink
              key={name}
              to={name}
              style={({ isActive, isPending }) => ({
                color: isActive ? 'inherit' : isPending ? 'yellow' : 'blue',
                marginRight: '1em',
              })}
            >
              {name}
            </NavLink>
          ))}
          <NavLink
            to="/new"
            style={({ isActive, isPending }) => ({
              color: isActive ? 'inherit' : isPending ? 'yellow' : 'blue'
            })}
          >
            + New
          </NavLink>
        </nav>
      )}
      <Outlet />
    </>
  )
}

export const element = <App />