import React from 'react'
import {
  useLoaderData,
  Outlet,
  NavLink,
  useLocation,
} from 'react-router-dom'
import type { LoaderFunction } from '@remix-run/router'
import { getLedgers } from '../../data'

export const loader: LoaderFunction = async (): Promise<string[]> => {
  return getLedgers()
}

function App() {
  const ledgers = useLoaderData() as Awaited<string[]>
  const location = useLocation()
  return (
    <>
      {ledgers.length > 0 && (
        <nav>
          {ledgers.map(name => (
            <React.Fragment key={name}>
              <NavLink
                to={name}
                style={({ isActive, isPending }) => ({
                  color: isActive ? 'inherit' : isPending ? 'yellow' : 'blue',
                  marginRight: '1em',
                })}
              >
                {name}
              </NavLink>
              {new RegExp(`^/${name}`).test(location.pathname) && (
                <NavLink
                  to={`${name}/edit`}
                  style={({ isActive, isPending }) => ({
                    color: isActive ? 'inherit' : isPending ? 'yellow' : 'blue',
                    marginRight: '1.5em',
                    marginLeft: '-0.5em',
                    textDecoration: 'none',
                  })}
                  title="edit"
                >
                  ⚙
                </NavLink>
              )}
            </React.Fragment>
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