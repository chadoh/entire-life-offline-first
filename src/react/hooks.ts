import React from 'react'

export function usePrev<T>(item: T): undefined | T {
  const ref = React.useRef<T>()
  React.useEffect(() => {
    ref.current = item
  }, [item])
  return ref.current
}
