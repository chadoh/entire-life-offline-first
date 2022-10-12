import React from 'react'
import { Form, useLoaderData, redirect } from 'react-router-dom'
import type { ActionFunction, LoaderFunction } from '@remix-run/router'
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

function New() {
  const [error, setError] = React.useState<string>()
  const ledgers = useLoaderData() as Awaited<string[]>

  return (
    <Form method="post">
      <label className={error && 'error'}>
        Name
        <input name="name" autoFocus onChange={(e) => {
          const val = (e.target as HTMLInputElement).value.trim()
          if (ledgers.indexOf(val) > -1) {
            setError(`You already have a chart for ${val}; please use a unique name.`)
          } else {
            setError(undefined)
          }
        }} />
        {error && <div className="errorMessage">{error}</div>}
      </label>
      <label>
        Date of birth
        <input type="date" defaultValue="1990-01-01" name="dob" />
      </label>
      <button>
        Save
      </button>
    </Form>
  )
}

export const element = <New />