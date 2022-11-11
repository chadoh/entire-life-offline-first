import React from 'react'
import {
  useLoaderData,
  Outlet,
  NavLink,
  Link,
  useParams,
} from 'react-router-dom'
import type { LoaderFunction } from '@remix-run/router'
import { getLedgers } from '../../../data/local'
import Login from '../../components/login'

export const loader: LoaderFunction = async (): Promise<string[]> => {
  return getLedgers()
}

function App() {
  const ledgers = useLoaderData() as Awaited<string[]>
  const params = useParams()
  return (
    <>
      <nav>
        {ledgers.length > 0 && (
          <>
            {ledgers.map(name => (
              <React.Fragment key={name}>
                <Link
                  to={name}
                  style={{
                    color: params.ledgerName === name ? 'inherit' : 'blue',
                    marginRight: '1em',
                  }}
                >
                  {name}
                </Link>
                {params.ledgerName === name && (
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
          </>
        )}
        <Login />
      </nav>
      <Outlet />
    </>
  )
}

export const element = <App />
