import React from 'react'
import { useRevalidator } from 'react-router-dom'
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
  const revalidator = useRevalidator()
  React.useEffect(() => {
    return subscribe(() => {
      revalidator.revalidate()
    })
  }, [])
}

