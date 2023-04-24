import React from 'react'
import { useLoaderData, Form, Outlet, NavLink } from 'react-router-dom'
import type { LoaderFunction } from '@remix-run/router'
import { get, Entry } from '../../../../data/local'
import { useDataSubscription } from '../../../hooks'

export const loader: LoaderFunction = async ({ params }): Promise<Entry[]> => {
  const name = params.ledgerName as string
  const entries = await get(name)
  if (!entries) {
    throw new Response('', {
      status: 404,
      statusText: 'Not Found',
    })
  }
  return entries
}

function Entries() {
  useDataSubscription()
  const entries = useLoaderData() as Entry[]
  return (
    <>
      <ul>
        {entries.map(entry => (
          <li key={entry.created}>
            <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h2>
                {entry.emoji && `${entry.emoji} `}
                {entry.title}
              </h2>
              <nav style={{ display: 'flex' }}>
                <NavLink
                  to={`edit/${entry.created}`}
                  style={({ isActive, isPending }) => ({
                    color: isActive ? 'inherit' : isPending ? 'yellow' : 'blue',
                  })}
                >
                  edit
                </NavLink>
                <Form
                  method="post"
                  action={`destroy/${entry.created}`}
                  onSubmit={(event) => {
                    if (
                      !confirm(
                        "Please confirm you want to delete this record."
                      )
                    ) {
                      event.preventDefault();
                    }
                  }}
                >
                  <button type="submit" style={{ display: 'inline-block', padding: 0, border: 'none', marginLeft: '0.5em', color: 'blue', fontSize: 'inherit', textDecoration: 'underline', cursor: 'pointer' }}>
                    delete
                  </button>
                </Form>
              </nav>
            </header>
            <p>
              <time dateTime={entry.date}>{entry.date}</time>
              {entry.body && <><br />{entry.body}</>}
            </p>
          </li>
        ))}
      </ul>
      <Outlet />
    </>
  )
}

export const element = <Entries />
