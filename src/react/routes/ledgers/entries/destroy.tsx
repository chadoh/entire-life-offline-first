import { redirect } from 'react-router-dom'
import type { ActionFunction, LoaderFunction } from '@remix-run/router'
import { deleteEntry } from '../../../data'

export const loader: LoaderFunction = async ({ params }) => {
  return redirect(`/${params.ledgerName}`)
}

export const action: ActionFunction = async ({ params }) => {
  const ledgerName = params.ledgerName as string
  await deleteEntry(
    ledgerName,
    parseInt(params.entryCreated as string)
  )
  return redirect(`/${ledgerName}`)
}