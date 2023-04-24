import React from 'react'
import { google } from '../../data'

export default function Login() {
  const [wantsGoogle, setWantsGoogle] = React.useState(false)
  const [signedIn, setSignedIn] = React.useState(false)

  // Only load/contact Google if the user currently signed in with Google
  React.useEffect(() => {
    google.isWanted().then(setWantsGoogle)
  }, [])

  React.useEffect(() => {
    // if `wantsGoogle` changes from false to true, load Google scripts
    if (wantsGoogle) {
      google.load().then(async ([gapi]) => {
        if (gapi.client.getToken() !== null) {
          setSignedIn(true)
        }
      })
    }
  }, [wantsGoogle]);

  if (signedIn) {
    return (
      <>
        <button
          style={{ float: 'right', marginLeft: '0.5em' }}
          onClick={() => google.signOut(() => setSignedIn(false))}
        >
          Sign Out
        </button>
        <button
          style={{ float: 'right', marginLeft: '0.5em' }}
          onClick={() => google.signIn()}
        >
          Refresh
        </button>
      </>
    )
  }

  return (
    <button
      style={{ float: 'right', marginLeft: '0.5em' }}
      onClick={() => google.signIn(async () => {
        setSignedIn(true)
      })}
    >
      Sync with Google Sheets
    </button>
  )
}
