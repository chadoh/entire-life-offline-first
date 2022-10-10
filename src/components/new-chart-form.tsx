import React from 'react'
import { db, useData } from '../database'

export default function NewChartForm() {
  const { charts } = useData()
  const [error, setError] = React.useState<string>()

  return (
    <form onSubmit={(e) => {
      e.preventDefault()
      const inputs = (e.target as HTMLFormElement).elements as unknown as { name: HTMLInputElement, dob: HTMLInputElement }
      try {
        db.addChart({
          name: inputs.name.value,
          dob: inputs.dob.value,
        })
        inputs.name.value = ''
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : String(e))
      }
    }}>
      <label className={error && 'error'}>
        Name
        <input id="name" autoFocus onKeyUp={(e) => {
          const val = (e.target as HTMLInputElement).value.trim()
          if (charts[val]) {
            setError(`You already have a chart for ${val}; please name this one something unique.`)
          } else {
            setError(undefined)
          }
        }} />
        {error && <div className="errorMessage">{error}</div>}
      </label>
      <label>
        Date of birth
        <input type="date" defaultValue="1990-01-01" id="dob" />
      </label>
      <button>
        Save
      </button>
    </form>
  )
}