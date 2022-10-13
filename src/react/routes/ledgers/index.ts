import * as root from './root'
import * as show from './show'
import * as newLedger from './new'
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
          index: true
        },
        {
          ...newLedger,
          path: 'new'
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