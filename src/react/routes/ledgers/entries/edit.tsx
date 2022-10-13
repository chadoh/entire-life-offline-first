import React from 'react'
import { useLoaderData, redirect } from 'react-router-dom'
import type { ActionFunction, LoaderFunction } from '@remix-run/router'
import { get, updateEntry, Entry } from '../../../data'
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
  const entryId = parseInt(params.entryId as string)
  const entry = entries[entryId]
  if (!entry) {
    throw new Response('', {
      status: 404,
      statusText: `Cannot find existing entry #${entryId}! Someone else may have edited or deleted it while you had this page open. Refresh the page and try again (you may want to copy your work-in-progress).`,
    })
  }
  return entry
}

export const action: ActionFunction = async ({ request, params }) => {
  const ledgerName = params.ledgerName as string
  const formData = await request.formData()
  const entry = Object.fromEntries(formData) as unknown as Entry
  await updateEntry(
    ledgerName,
    parseInt(params.entryId as string),
    entry
  )
  return redirect(`/${ledgerName}`)
}

function Edit() {
  const entry = useLoaderData() as Entry
  return <Form {...entry} />
}

export const element = <Edit />