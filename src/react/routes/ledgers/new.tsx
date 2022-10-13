import React from 'react'
import { useLoaderData, redirect } from 'react-router-dom'
import type { ActionFunction, LoaderFunction } from '@remix-run/router'
import { addLedger, getLedgers } from '../../data'
import Form from './form'

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
  const ledgers = useLoaderData() as Awaited<string[]>
  return <Form ledgers={ledgers} />
}

export const element = <New />