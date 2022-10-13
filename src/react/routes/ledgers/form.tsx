import React from 'react'
import { Form } from 'react-router-dom'

interface Props {
  ledgers: string[]
  ledger?: {
    name: string
  }
}

export default function LedgerForm({ ledgers, ledger }: Props) {
  const [error, setError] = React.useState<string>()

  return (
    <Form method="post">
      <p>
        <label htmlFor="name">Name</label>
        <input name="name" autoFocus defaultValue={ledger?.name} onChange={(e) => {
          const val = (e.target as HTMLInputElement).value.trim()
          if (ledgers.indexOf(val) > -1) {
            setError(`You already have a chart for ${val}; please use a unique name.`)
          } else {
            setError(undefined)
          }
        }} />
        {error && <><br /><span className="errorMessage">{error}</span></>}
      </p>
      {!ledger && ( // if `ledger` included, this is an edit, and `dob` is nonsensical
        <p>
          <label htmlFor="date">Date of birth</label>
          <input type="date" defaultValue="1990-01-01" name="dob" />
        </p>
      )}
      <button>
        Save
      </button>
    </Form>
  )
}