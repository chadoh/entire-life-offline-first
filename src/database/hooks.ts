import { useEffect, useState } from 'react'
import { db, DataUpdatedEvent, SaveFailureEvent } from '.'
import type { Data } from './types'

export function useDB(): Data & { errors: string[] } {
  const [data, setData] = useState(db.fetchData())
  const [errors, setErrors] = useState([] as string[])
  function updateData(e: DataUpdatedEvent) {
    setData(e.data)
  }
  function updateErrors(e: SaveFailureEvent) {
    setErrors([e.error, ...errors])
  }
  useEffect(() => {
    db.addSaveSuccessListener(updateData)
    db.addSaveFailureListener(updateErrors)
    return function unmount() {
      db.removeSaveSuccessListener(updateData)
      db.removeSaveFailureListener(updateErrors)
    }
  })
  return { ...data, errors }
}