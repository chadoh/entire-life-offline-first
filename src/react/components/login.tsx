import React from 'react'

let tokenClient: google.accounts.oauth2.TokenClient

const scope = [
  'https://www.googleapis.com/auth/spreadsheets.readonly',
].join(' ');

const DISCOVERY_DOC = 'https://sheets.googleapis.com/$discovery/rest?version=v4';

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

function handleAuthClick() {
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
  const [gapiReady, setGapiReady] = React.useState(false)
  const [gisReady, setGisReady] = React.useState(false)
  const [signedIn, setSignedIn] = React.useState(false)

  async function intializeGapiClient() {
    await gapi.client.init({
      apiKey: import.meta.env.PUBLIC_GOOGLE_API_KEY,
      discoveryDocs: [DISCOVERY_DOC],
    })
    setGapiReady(true)
  }

  function initializeGoogleIdentityServices() {
    tokenClient = google.accounts.oauth2.initTokenClient({
      client_id: import.meta.env.PUBLIC_GOOGLE_OAUTH_CLIENT_ID,
      scope,
      callback: async (resp) => {
        if (resp.error !== undefined) {
          throw (resp);
        }
        console.log(await listMajors())
        setSignedIn(true)
      },
    })
    setGisReady(true)
  }

  React.useEffect(() => {
    const gapiScript = document.createElement('script');
    gapiScript.src = 'https://apis.google.com/js/api.js';
    gapiScript.onload = () => {
      gapi.load('client', intializeGapiClient);
    }
    document.body.appendChild(gapiScript);

    const gisScript = document.createElement('script');
    gisScript.src = 'https://accounts.google.com/gsi/client';
    gisScript.onload = initializeGoogleIdentityServices
    document.body.appendChild(gisScript);

    return () => {
      gapiScript.remove()
      gisScript.remove()
    }
  }, []);

  if (!gapiReady || !gisReady) return null

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
          onClick={handleAuthClick}
        >
          Refresh
        </button>
      </>
    )
  }

  return (
    <button
      style={{ float: 'right', marginLeft: '0.5em' }}
      onClick={handleAuthClick}
    >
      Sync with Google Sheets
    </button>
  )
}
