import React from 'react'
import { useLoaderData, Outlet } from 'react-router-dom'
import type { LoaderFunction } from '@remix-run/router'
import { get, Entry } from '../../../data'

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
  const entries = useLoaderData() as Entry[]
  return (
    <>
      <ul>
        {entries.map((entry, i) => (
          <li key={i}>
            <header>
              <h2>
                {entry.emoji && `${entry.emoji} `}
                {entry.title}
              </h2>
              <time dateTime={entry.date}>{entry.date}</time>
            </header>
            {entry.body && <p>{entry.body}</p>}
          </li>
        ))}
      </ul>
      <Outlet />
    </>
  )
}

export const element = <Entries />