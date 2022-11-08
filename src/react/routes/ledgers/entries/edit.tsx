import React from 'react'
import { useLoaderData, redirect } from 'react-router-dom'
import type { ActionFunction, LoaderFunction } from '@remix-run/router'
import { get, updateEntry, Entry, UserFacingEntry } from '../../../../data/local'
import Form from './form'

export const loader: LoaderFunction = async ({ params }): Promise<Entry> => {
  const name = params.ledgerName as string
  const entries = await get(name)
  if (!entries) {
    throw new Response('', {
      status: 404,
      statusText: `Can't find data for ${name}; maybe the data was edited by someone else while you had the page opened? Refresh the page and try again!`,
    })
  }
  const entryCreated = parseInt(params.entryCreated as string)
  const entry = entries.find(e => e.created === entryCreated)
  if (!entry) {
    throw new Response('', {
      status: 404,
      statusText: `Cannot find existing entry with created="${entryCreated}"! Someone else may have deleted it while you had this page open. Refresh the page and try again (you may want to copy your work-in-progress).`,
    })
  }
  return entry
}

/**
 * Forms serialize all inputs as strings
 */
interface EntryFromForm extends UserFacingEntry {
  created: string
  updated: string
}

export const action: ActionFunction = async ({ request, params }) => {
  const ledgerName = params.ledgerName as string
  const formData = await request.formData()
  const entryFromForm = Object.fromEntries(formData) as unknown as EntryFromForm
  const entry: Entry = {
    ...entryFromForm,
    created: parseInt(entryFromForm.created),
    updated: parseInt(entryFromForm.updated),
  }
  await updateEntry(ledgerName, entry)
  return redirect(`/${ledgerName}`)
}

function Edit() {
  const entry = useLoaderData() as Entry
  return <Form key={entry.title + entry.date} {...entry} />
}

export const element = <Edit />