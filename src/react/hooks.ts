import React from 'react'
import { useNavigate } from 'react-router-dom'
import { subscribe } from '../data/local'

export function usePrev<T>(item: T): undefined | T {
  const ref = React.useRef<T>()
  React.useEffect(() => {
    ref.current = item
  }, [item])
  return ref.current
}

/**
 * Refresh data from this route's `loader` when data changes in the local data store.
 */
export function useDataSubscription() {
  const navigate = useNavigate()
  React.useEffect(() => {
    return subscribe(() => {
      navigate('.', { replace: true })
    })
  }, [])
}
