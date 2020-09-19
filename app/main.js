const fs = require('fs');
const readline = require('readline');
const {google} = require('googleapis');
const moment = require('moment')

// If modifying these scopes, delete token.json.
const SCOPES = ['https://www.googleapis.com/auth/calendar.readonly'];
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.

const TOKEN_PATH = '../secrets/token.json';
const CREDENTIALS_PATH = '../secrets/credentials.json'
var events = {}

let alerts = [
  //1 week
  {
    ms: 1000 * 60 * 60 * 24 * 7, 
    name: "week", 
    display: "in one week", 
    momentUnit: "weeks", 
    momentValue: 1
  },
  {
    ms: 1000 * 60 * 60 * 24, 
    name: "day", 
    display: "in one day",
    momentUnit: "days",
    momentValue: 1
  },
  {
    ms: 1000 * 60 * 60 , 
    name: "hour", 
    display: "in one hour", 
    momentUnit: "hours", 
    momentValue: 1
  },
  {
    ms: 0, 
    name: "now", 
    display: "now", 
    momentUnit: "minutes", 
    momentValue: 0
  }
]

fs.readFile(CREDENTIALS_PATH, (err, content) => {
  if (err) return console.log('Error loading client secret file:', err);
  // Authorize a client with credentials, then call the Google Calendar API.
  authorize(JSON.parse(content), listEvents);
});

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize(credentials, callback) {
  const {client_secret, client_id, redirect_uris} = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(
      client_id, client_secret, redirect_uris[0]);

  // Check if we have previously stored a token.
  fs.readFile(TOKEN_PATH, (err, token) => {
    if (err) return getAccessToken(oAuth2Client, callback);
    oAuth2Client.setCredentials(JSON.parse(token));
    callback(oAuth2Client);
  });
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback for the authorized client.
 */
function getAccessToken(oAuth2Client, callback) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });
  console.log('Authorize this app by visiting this url:', authUrl);
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  rl.question('Enter the code from that page here: ', (code) => {
    rl.close();
    oAuth2Client.getToken(code, (err, token) => {
      if (err) return console.error('Error retrieving access token', err);
      oAuth2Client.setCredentials(token);
      // Store the token to disk for later program executions
      fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
        if (err) return console.error(err);
        console.log('Token stored to', TOKEN_PATH);
      });
      callback(oAuth2Client);
    });
  });
}

function listEvents(auth) {
  const calendar = google.calendar({version: 'v3', auth});
  calendar.events.list({
    calendarId: process.env.CALENDAR_ID,
    timeMin: (new Date()).toISOString(),
    maxResults: 10,
    singleEvents: true,
    orderBy: 'startTime',
  }, (err, res) => {
    if (err) return console.log('The API returned an error: ' + err);
    for (var event of res.data.items){
      event.alerts = {}
      let start = Date.parse(event.start.dateTime)
      for(var alert of alerts){
        let alertTime = moment(start).subtract(alert.momentValue, alert.momentUnit)
        let msUntil = alertTime.valueOf() - new Date().valueOf() 
        if(msUntil > 0){
          console.log({alert: alert.display, msUntil})
          event.alerts[alert.name] = setTimeout(sendNotification, msUntil, event, alert)
        }
      }
    }
  });
}

const sendNotification = (event, alert) => {
  console.log({event, alert})
}

const watch = async (auth) => {
  const res = await calendar.acl.watch({
        // Calendar identifier. To retrieve calendar IDs call the calendarList.list method. If you want to access the primary calendar of the currently logged in user, use the "primary" keyword.
        calendarId: process.env.CALENDAR_ID,
        // Request body metadata
        requestBody: {
          // request body parameters
          // {
          //   "address": "my_address",
          //   "expiration": "my_expiration",
          //   "id": "my_id",
          //   "kind": "my_kind",
          //   "params": {},
          //   "payload": false,
          //   "resourceId": "my_resourceId",
          //   "resourceUri": "my_resourceUri",
          //   "token": "my_token",
          //   "type": "my_type"
          // }
        },
      });
}
