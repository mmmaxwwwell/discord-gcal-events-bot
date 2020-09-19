const fs = require('fs')
const readline = require('readline')
const {google} = require('googleapis')
const console = require('./logger')

// If modifying these scopes, delete token.json.
const SCOPES = ['https://www.googleapis.com/auth/calendar.readonly']
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.

const TOKEN_PATH = '../secrets/token.json';
const CREDENTIALS_PATH = '../secrets/credentials.json'

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */

const authorize = async (credentials) => new Promise((resolve, reject) => {
  fs.readFile(CREDENTIALS_PATH, async (err, content) => {
    if (err) return console.log('Error loading client secret file:', err)
    // Authorize a client with credentials, then call the Google Calendar API.
    const credentials = JSON.parse(content)
    const {client_secret, client_id, redirect_uris} = credentials.installed
    const oAuth2Client = new google.auth.OAuth2(
        client_id, client_secret, redirect_uris[0])

    // Check if we have previously stored a token.
    fs.readFile(TOKEN_PATH, async (err, token) => {
      if (err){
        token = await getAccessToken(oAuth2Client)
      } 
      // console.log({event: 'token', token: JSON.parse(token)})
      oAuth2Client.setCredentials(JSON.parse(token))
      resolve(oAuth2Client)
    })
  })
})

const getAccessToken = async (oAuth2Client) => new Promise((resolve, reject) => {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });
  console.log('Authorize this app by visiting this url:', authUrl)
  oAuth2Client.getToken(code, (err, token) => {
    if (err){
      console.error('Error retrieving access token', err)
      process.exit()
    }
    oAuth2Client.setCredentials(token)
    // Store the token to disk for later program executions
    fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
      if (err) return console.error(err)
      console.log('Token stored to', TOKEN_PATH)
    })
    resolve(oAuth2Client)
  })
})

const listEvents = (maxResults = 10) => new Promise( async (resolve, reject) => {
  let auth = await authorize()
  const calendar = google.calendar({version: 'v3', auth});
  calendar.events.list({
    calendarId: process.env.CALENDAR_ID,
    timeMin: (new Date()).toISOString(),
    maxResults: maxResults,
    singleEvents: true,
    orderBy: 'startTime',
  }, (err, res) => {
    if (err) {
      console.log('The API returned an error: ' + err)
      reject()
      return
    }
    resolve(res.data.items)
  });
})

module.exports = {listEvents}