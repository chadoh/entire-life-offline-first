import * as root from './root'
import * as newEntry from './new'
import * as edit from './edit'
import * as destroy from './destroy'
import errorElement from '../../error'

// a routes object that can be passed to `children` in the router
export default {
  ...root,
  children: [
    {
      errorElement,
      children: [
        {
          ...newEntry,
          index: true,
        },
        {
          ...edit,
          path: 'edit/:entryCreated',
        },
        {
          ...destroy,
          path: 'destroy/:entryCreated'
        }
      ]
    }
  ]
}
