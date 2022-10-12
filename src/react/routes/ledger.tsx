import React from 'react'
import {
  useLoaderData,
  useFetcher,
} from 'react-router-dom'
import type { ActionFunction, LoaderFunction } from '@remix-run/router'
import { usePrev } from '../hooks'
import { get, addEntry, Entry } from '../data'

type Data = {
  name: string
  entries: Entry[]
}

export const loader: LoaderFunction = async ({ params }): Promise<Data> => {
  const name = params.ledgerName as string
  const entries = await get(name)
  if (!entries) {
    throw new Response('', {
      status: 404,
      statusText: 'Not Found',
    })
  }
  return { name, entries }
}

export const action: ActionFunction = async ({ request, params }) => {
  const ledgerName = params.ledgerName as string
  const formData = await request.formData()
  const entry = Object.fromEntries(formData) as unknown as Entry
  await addEntry(ledgerName, entry)
}

function Chart() {
  const { name, entries } = useLoaderData() as Data
  return (
    <>
      <h1>{name}</h1>
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
          <input name="body" />
          <label htmlFor="body">Body</label>
        </p>
        <button>
          Save
        </button>
      </fieldset>
    </fetcher.Form>
  )
}

export const element = <Chart />