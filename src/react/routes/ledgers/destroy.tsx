import { redirect } from 'react-router-dom'
import type { ActionFunction } from '@remix-run/router'
import { removeLedger } from '../../../data/local'

export const action: ActionFunction = async ({ params }) => {
  await removeLedger(params.ledgerName as string)
  return redirect('/')
}