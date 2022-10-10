import React from 'react'

interface Chart {
  name: string
  dob: string // iso8601 ie 1990-01-01
}

export default function NewChartForm() {
  return (
    <form onSubmit={(e) => {
      e.preventDefault()
      const inputs = (e.target as HTMLFormElement).elements as unknown as { name: HTMLInputElement, dob: HTMLInputElement }
      // save to localStorage
      console.log({
        name: inputs.name.value,
        dob: inputs.dob.value,
      } as Chart)
    }}>
      <label>
        Name
        <input id="name" autoFocus />
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