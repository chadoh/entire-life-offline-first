import React from 'react'
import { db } from '../database'

export default function NewChartForm() {
  return (
    <form onSubmit={(e) => {
      e.preventDefault()
      const inputs = (e.target as HTMLFormElement).elements as unknown as { name: HTMLInputElement, dob: HTMLInputElement }
      // save to localStorage
      db.addChart({
        name: inputs.name.value,
        dob: inputs.dob.value,
      })
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