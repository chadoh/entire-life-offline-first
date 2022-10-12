import React from 'react'
import { Form } from 'react-router-dom'
import { useData } from '../database'

export default function NewChartForm() {
  const { charts } = useData()
  const [error, setError] = React.useState<string>()

  return (
    <Form method="post" action="/">
      <label className={error && 'error'}>
        Name
        <input name="name" autoFocus onChange={(e) => {
          const val = (e.target as HTMLInputElement).value.trim()
          if (charts[val]) {
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