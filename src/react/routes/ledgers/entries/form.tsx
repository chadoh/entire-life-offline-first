import React from 'react'
import { useFetcher } from 'react-router-dom'
import { usePrev } from '../../../hooks'
import type { Entry } from '../../../../data/local'

export default function EntryForm(entry: Partial<Entry>) {
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
      {entry.created && (
        <input type="hidden" name="created" value={entry.created} />
      )}
      <fieldset disabled={fetcher.state !== 'idle'}>
        <p>
          <input name="title" autoFocus required defaultValue={entry.title} />
          <label htmlFor="title">Title</label>
        </p>
        <p>
          <input type="date" name="date" required defaultValue={entry.date} />
          <label htmlFor="date">Date</label>
        </p>
        <p>
          <input name="emoji" defaultValue={entry.emoji} />
          <label htmlFor="emoji">Emoji</label>
        </p>
        <p>
          <input name="body" defaultValue={entry.body} />
          <label htmlFor="body">Body</label>
        </p>
        <button>
          Save
        </button>
      </fieldset>
    </fetcher.Form>
  )
}