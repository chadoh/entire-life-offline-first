import React from 'react'
import type { ActionFunction } from '@remix-run/router'
import { addEntry, Entry } from '../../../data'
import Form from './form'

export const action: ActionFunction = async ({ request, params }) => {
  const ledgerName = params.ledgerName as string
  const formData = await request.formData()
  const entry = Object.fromEntries(formData) as unknown as Entry
  await addEntry(ledgerName, entry)
}

export const element = <Form />