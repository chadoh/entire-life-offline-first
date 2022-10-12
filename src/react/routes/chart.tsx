import React from 'react'
import {
  useLoaderData,
  useFetcher,
} from 'react-router-dom'
import type { ActionFunction, LoaderFunction } from '@remix-run/router'
import { usePrev } from '../hooks'

import { db, Chart, Entry } from '../database'

export const loader: LoaderFunction = async ({ params }): Promise<Chart> => {
  const { charts } = db.fetchData()
  const chart = charts[params.chartName as string]
  if (!chart) {
    throw new Response('', {
      status: 404,
      statusText: 'Not Found',
    })
  }
  return chart
}

export const action: ActionFunction = async ({ request, params }) => {
  const chartName = params.chartName as string
  const formData = await request.formData()
  const entry = Object.fromEntries(formData) as unknown as Entry
  db.addEntry(chartName, entry)
}

function Chart() {
  const chart = useLoaderData() as Chart
  return (
    <>
      <h1>{chart.name}</h1>
      <ul>
        {chart.entries.map((entry, i) => (
          <li key={i}>
            <header>
              <h2>
                {entry.emoji && `${entry.emoji} `}
                {entry.title}
              </h2>
              <time dateTime={entry.date}>{entry.date}</time>
            </header>
            {entry.description && <p>{entry.description}</p>}
          </li>
        ))}
      </ul>
      <NewEntry />
    </>
  )
}

function NewEntry() {
  const fetcher = useFetcher()
  const prevState = usePrev(fetcher.state)
  const form = React.useRef<HTMLFormElement>(null)

  // reset form after submission
  React.useEffect(() => {
    if (form.current && prevState === 'loading' && fetcher.state === 'idle') {
      form.current.reset()
      form.current.querySelector('input')?.focus()
    }
  }, [prevState])

  return (
    <fetcher.Form method="post" ref={form}>
      <fieldset disabled={fetcher.state !== 'idle'}>
        <p>
          <input name="title" autoFocus required />
          <label htmlFor="title">Title</label>
        </p>
        <p>
          <input type="date" name="date" required />
          <label htmlFor="date">Date</label>
        </p>
        <p>
          <input name="emoji" />
          <label htmlFor="emoji">Emoji</label>
        </p>
        <p>
          <input name="description" />
          <label htmlFor="description">Description</label>
        </p>
        <button>
          Save
        </button>
      </fieldset>
    </fetcher.Form>
  )
}

export const element = <Chart />