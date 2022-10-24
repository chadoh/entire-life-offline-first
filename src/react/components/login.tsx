import React from 'react'
import { WANTS_GOOGLE, set, get } from '../data'

const scope = [
  'https://www.googleapis.com/auth/spreadsheets.readonly',
].join(' ');

const DISCOVERY_DOC = 'https://sheets.googleapis.com/$discovery/rest?version=v4';

let gapiLoaded = false

/**
 * Fetch Google API (gapi) by adding new `<script>` tag to page and then loading app's `gapi.client`.
 * Returns immediately if `gapi` global is already available.
 * Otherwise, will only return after everything's initialized.
 */
async function loadGapi(): Promise<typeof gapi> {
  if (gapiLoaded) return gapi;

  const gapiScript = document.createElement('script');
  gapiScript.src = 'https://apis.google.com/js/api.js';
  gapiScript.onload = () => {
    gapi.load('client', async () => {
      await gapi.client.init({
        apiKey: import.meta.env.PUBLIC_GOOGLE_API_KEY,
        discoveryDocs: [DISCOVERY_DOC],
      })
      gapiLoaded = true
    })
  }
  document.body.appendChild(gapiScript);

  return new Promise((resolve) => {
    const gapiChecker = setInterval(() => {
      if (gapiLoaded) {
        clearInterval(gapiChecker)
        resolve(gapi)
      }
    }, 50)
  });
}

let tokenClient: google.accounts.oauth2.TokenClient

async function loadGoogleIdentityServices(callback?: () => void): Promise<google.accounts.oauth2.TokenClient> {
  if (tokenClient) return tokenClient

  const gisScript = document.createElement('script');
  gisScript.src = 'https://accounts.google.com/gsi/client';
  gisScript.onload = () => {
    tokenClient = google.accounts.oauth2.initTokenClient({
      client_id: import.meta.env.PUBLIC_GOOGLE_OAUTH_CLIENT_ID,
      scope,
      callback: async (resp) => {
        if (resp.error !== undefined) {
          throw (resp);
        }
        if (callback) callback()
        console.log(await listMajors())
      },
    })
  }
  document.body.appendChild(gisScript);

  return new Promise((resolve) => {
    const gisChecker = setInterval(() => {
      if (tokenClient) {
        clearInterval(gisChecker)
        resolve(tokenClient)
      }
    }, 50)
  });
};

/**
 * Return the names and majors of students in a sample spreadsheet:
 * https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit
 * @returns string[] if successful; `undefined` if unsuccessful
 */
async function listMajors(): Promise<string[] | undefined> {
  let response;
  // Fetch first 10 files
  response = await gapi.client.sheets.spreadsheets.values.get({
    spreadsheetId: '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms',
    range: 'Class Data!A2:E',
  });
  const range = response.result;
  if (!range || !range.values || range.values.length == 0) {
    return undefined
  }
  return range.values.reduce(
      (arr, row) => [...arr, `${row[0]}, ${row[4]}`],
    ['Name, Major', ]
  );
}

async function handleAuthClick(callback?: () => void) {
  const [gapi, tokenClient] = await Promise.all([
    loadGapi(),
    loadGoogleIdentityServices(callback),
    set(WANTS_GOOGLE, true), // no value returned, but done in Promise.all to avoid blocking other calls
  ]);

  if (gapi.client.getToken() === null) {
    // Prompt the user to select a Google Account and ask for consent to share their data
    // when establishing a new session.
    tokenClient.requestAccessToken({prompt: 'consent'});
  } else {
    // Skip display of account chooser and consent dialog for an existing session.
    tokenClient.requestAccessToken({prompt: ''});
  }
}

export default function Login() {
  const [wantsGoogle, setWantsGoogle] = React.useState(false)
  const [signedIn, setSignedIn] = React.useState(false)

  // check if user has previously indicated they want Google services loaded/contacted
  React.useEffect(() => {
    get(WANTS_GOOGLE).then(setWantsGoogle)
  }, [])

  React.useEffect(() => {
    // if `wantsGoogle` changes from false to true, load Google scripts prior to button click
    if (wantsGoogle) {
      loadGapi()
      loadGoogleIdentityServices(() => setSignedIn(true))
    }
  }, [wantsGoogle]);

  if (signedIn) {
    return (
      <>
        <button
          style={{ float: 'right', marginLeft: '0.5em' }}
          onClick={() => {
            const token = gapi.client.getToken();
            if (token !== null) {
              google.accounts.oauth2.revoke(token.access_token, () => {
                setSignedIn(false)
              });
              gapi.client.setToken(null);
            }
          }}
        >
          Sign Out
        </button>
        <button
          style={{ float: 'right', marginLeft: '0.5em' }}
          onClick={() => handleAuthClick()}
        >
          Refresh
        </button>
      </>
    )
  }

  return (
    <button
      style={{ float: 'right', marginLeft: '0.5em' }}
      onClick={() => handleAuthClick(() => setSignedIn(true))}
    >
      Sync with Google Sheets
    </button>
  )
}
