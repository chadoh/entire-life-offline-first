import React from 'react'
import { useParams, Outlet } from 'react-router-dom'

function Show() {
  const { ledgerName } = useParams() as { ledgerName: string }
  return (
    <>
      <h1>{ledgerName}</h1>
      <Outlet />
    </>
  )
}

export const element = <Show />