import * as root from './root'
import * as show from './show'
import * as newLedger from './new'
import * as edit from './edit'
import * as destroy from './destroy'
import errorElement from '../error'
import entries from './entries'

export default {
  ...root,
  children: [
    {
      errorElement,
      children: [
        {
          ...newLedger,
          index: true,
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