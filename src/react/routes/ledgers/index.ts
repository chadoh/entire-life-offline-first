import * as root from './root'
import * as show from './show'
import * as newLedger from './new'
import * as edit from './edit'
import * as destroy from './destroy'
import errorElement from '../error'
import entries from './entries'
import { redirect } from 'react-router-dom'
import { getLedgers } from '../../data'
import type { LoaderFunction } from '@remix-run/router'

export const redirectToExisting: LoaderFunction = async (args): Promise<void | Response> => {
  const ledgers = await getLedgers()
  if (ledgers.length) {
    return redirect(`/${ledgers[0]}`)
  }
  return newLedger.loader(args)
}

export default {
  ...root,
  children: [
    {
      errorElement,
      children: [
        {
          ...newLedger,
          index: true,
          loader: redirectToExisting,
        },
        {
          ...newLedger,
          path: 'new'
        },
        {
          ...edit,
          path: ':ledgerName/edit',
        },
        {
          ...destroy,
          path: ':ledgerName/destroy',
        },
        {
          ...show,
          path: ':ledgerName',
          children: [
            {
              ...entries,
              errorElement,
            }
          ],
        },
      ]
    }
  ]
}