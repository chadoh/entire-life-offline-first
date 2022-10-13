import React from 'react'
import { Form, useLoaderData, redirect, useNavigate } from 'react-router-dom'
import type { ActionFunction, LoaderFunction } from '@remix-run/router'
import { updateLedger, getLedgers } from '../../data'
import EditForm from './form'

interface Data {
  ledgers: string[]
  ledger: {
    name: string
  }
}

export const loader: LoaderFunction = async ({ params }): Promise<Data> => {
  const ledgers = await getLedgers()
  const ledger = { name: params.ledgerName as string }
  return { ledgers, ledger }
}

export const action: ActionFunction = async ({ request, params }) => {
  const oldName = params.ledgerName as string
  const formData = await request.formData()
  const { name: newName } = Object.fromEntries(formData) as { name: string }
  await updateLedger({ newName, oldName })
  return redirect(`/${newName}`)
}

function Edit() {
  const { ledgers, ledger } = useLoaderData() as Awaited<Data>
  const navigate = useNavigate()

  return (
    <>
      <h1>Edit</h1>
      <EditForm ledgers={ledgers} ledger={ledger} />
      <h1>Or delete!</h1>
      <Form
        method="post"
        action={`/${ledger.name}/destroy`}
        onSubmit={(event) => {
          if (
            !confirm(
              `Please confirm you want to delete all data for ${ledger.name}. This can't be undone.`
            )
          ) {
            event.preventDefault();
          }
        }}
      >
        <button type="submit">
          Delete
        </button>
      </Form>
      <h1>Or cancel</h1>
      <button
        type="button"
        onClick={() => { navigate(-1) }}
      >
        Cancel
      </button>
    </>
  )
}

export const element = <Edit />