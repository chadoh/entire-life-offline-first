import React from 'react'
import { load, signIn, signOut, sync } from './google'
import { getGoogleToken } from '../../data'

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
      load().then(async ([gapi]) => {
        if (gapi.client.getToken() !== null) {
          setSignedIn(true)
          await sync()
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
        await sync()
      })}
    >
      Sync with Google Sheets
    </button>
  )
}