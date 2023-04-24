import React from 'react'
import { useLoaderData, redirect } from 'react-router-dom'
import type { ActionFunction, LoaderFunction } from '@remix-run/router'
import { addLedger, getLedgers } from '../../../data/local'
import { useDataSubscription } from '../../hooks'
import Form from './form'

export const loader: LoaderFunction = async ({ request }): Promise<string[] | Response> => {
  const ledgers = await getLedgers()
  if (ledgers.length === 0 || /new$/.test(request.url)) {
    return ledgers
  }
  return redirect(`/${ledgers[0]}`)
}

export const action: ActionFunction = async ({ request }) => {
  const formData = await request.formData()
  const newLedger = Object.fromEntries(formData) as unknown as Parameters<typeof addLedger>[0]
  await addLedger(newLedger)
  return redirect(`/${newLedger.name}`)
}

function New() {
  useDataSubscription()
  const ledgers = useLoaderData() as Awaited<string[]>
  return <Form ledgers={ledgers} />
}

export const element = <New />
