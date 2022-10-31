import React from 'react'

import { loadGoogle, tryTwice, signIn, signOut } from './google'
import { getGoogleToken } from '../../data'

/**
 * Return the names and majors of students in a sample spreadsheet:
 * https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit
 * @returns string[] if successful; `undefined` if unsuccessful
 */
async function listMajors(): Promise<string[] | void> {
  return tryTwice(() => (
    gapi.client.sheets.spreadsheets.values
      .get({
        spreadsheetId: '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms',
        range: 'Class Data!A2:E', // first 10 files
      })
      .then(response => (
        response.result?.values?.reduce(
          (arr, row) => [...arr, `${row[0]}, ${row[4]}`],
          ['Name, Major']
        )
      ))
  ))
}

export default function Login() {
  const [wantsGoogle, setWantsGoogle] = React.useState(false)
  const [signedIn, setSignedIn] = React.useState(false)

  // Only load/contact Google if the user currently signed in with Google
  React.useEffect(() => {
    getGoogleToken().then(_ => setWantsGoogle(true))
  }, [])

  React.useEffect(() => {
    // if `wantsGoogle` changes from false to true, load Google scripts
    if (wantsGoogle) {
      loadGoogle().then(async ([gapi]) => {
        if (gapi.client.getToken() !== null) {
          setSignedIn(true)
          console.log(await listMajors())
        }
      })
    }
  }, [wantsGoogle]);

  if (signedIn) {
    return (
      <>
        <button
          style={{ float: 'right', marginLeft: '0.5em' }}
          onClick={() => signOut(() => setSignedIn(false))}
        >
          Sign Out
        </button>
        <button
          style={{ float: 'right', marginLeft: '0.5em' }}
          onClick={() => signIn()}
        >
          Refresh
        </button>
      </>
    )
  }

  return (
    <button
      style={{ float: 'right', marginLeft: '0.5em' }}
      onClick={() => signIn(async () => {
        setSignedIn(true)
        console.log(await listMajors())
      })}
    >
      Sync with Google Sheets
    </button>
  )
}