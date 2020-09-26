const moment = require('moment')
const console = require('./logger')
const tz = require('moment-timezone')

let callbacks = []
var events = {}
let alerts = [
  {
    ms: 1000 * 60 * 60 * 24 * 7, 
    name: "week", 
    display: "in one week", 
    momentUnit: "weeks", 
    momentValue: 1,
    from: "start"
  },
  {
    ms: 1000 * 60 * 60 * 24, 
    name: "day", 
    display: "in one day",
    momentUnit: "days",
    momentValue: 1,
    from: "start"
  },
  {
    ms: 1000 * 60 * 60 , 
    name: "hour", 
    display: "in one hour", 
    momentUnit: "hours", 
    momentValue: 1,
    from: "start"
  },
  {
    ms: 0, 
    name: "now", 
    display: "now", 
    momentUnit: "minutes", 
    momentValue: 0,
    from: "start"
  },
  // {
  //   ms: 0, 
  //   name: "stop", 
  //   display: "end", 
  //   momentUnit: "minutes", 
  //   momentValue: 0,
  //   from: "end"
  // }
]

const trackEvents = (newEvents) => {
  for (var event of newEvents){
    if(events[event.id] === undefined){
      console.log({event: 'new-event', eventId: event.id})
      //new event
      events[event.id] = createAlerts(event)

      const nowMinus15 = moment(new Date()).subtract(parseInt(process.env.REFRESH_INTERVAL), 'minutes')
      const created = moment(new Date(event.created))

      if(nowMinus15.isBefore(created))
        sendNotification(event, 'dummy-value', 'new')

    } else if(Object.keys(events).includes(event.id) && events[event.id].updated != event.updated){
      console.log({
        event: 'updated-event', 
        eventsInclude: Object.keys(events).includes(event.id),
        eventUpdated: events[event.id].updated != event.updated
      })

      //event we already have indexed has changed
      //tear down timers and re-create'
      
      destroyAlerts(events[event.id])
      events[event.id] = createAlerts(event)
      sendNotification(event, 'dummy-value', 'update')
    }else{
      console.log({event:'existing-event', eventId: event.id})
    }
  
    //find any events that were deleted or we aren't tracking anymore
    //and delete the timers, then delete the event
    let newEventIds = newEvents.map(event => event.id)
    for(var eventId of Object.keys(events)){
      if(!newEventIds.includes(eventId)){
        console.log({event:'orphaned-event', eventId})
        destroyAlerts(events[event.id])
        delete events[eventId]
      }
    }
  }
}

const destroyAlerts = (event) => {
  if(event.alerts !== undefined)
    for(var alertId of Object.keys(events[event.id].alerts)){
      if(event.alerts[alertId] !== undefined) {
        console.log({
          event:'destroy-alert',
          eventId: event.id,
          alertName: alertId
        })
        clearTimeout(event.alerts[alertId])
      }
    }
  else
    console.log({event: 'event-alerts-undefined', event})
  return event
}

const createAlerts = (event) => {
  event.alerts = {}
  for(var alert of alerts){
    let alertTime = moment(Date.parse(event[alert.from].dateTime)).subtract(alert.momentValue, alert.momentUnit)
    let msUntil = alertTime.valueOf() - new Date().valueOf() 
    if(msUntil > 0){
      event.alerts[alert.name] = setTimeout(sendNotification, msUntil, event, alert)
      console.log({
        event:'create-alert', 
        eventId: event.id, 
        alertName: alert.name 
      })
    }
  }
  return event
}

const sendNotification = async (event, alert, messageType) => {
  const message = generateMessage(event, alert, messageType)
  for(callback of callbacks){
    callback(message)
  }
}

const generateMessage = (event, alert, messageType) => {
  let start = moment(event.start.dateTime).tz("America/New_York")
  let copyToMyCalendarURL = `https://calendar.google.com/calendar/u/0/r/eventedit/copy/${event.htmlLink.split('=')[1]}`
  
  let introPart
  switch(messageType){
    case 'new':
      introPart = `A new event \"${event.summary}\" was created!`
    break
    case 'update':
      introPart = `The event \"${event.summary}\" was updated.`
    break
    default:
      introPart = `The event \"${event.summary}\" is starting ${alert.display}!`
  }
  let message = `📢\r\n${introPart}\r\n\r\n${event.description || ""}\r\n\r\n`
  const embeds = [
    {
      title: `⏰  ${start.format('llll')} ${start.zoneAbbr()}`,
      color: 204,
      description: `🗓 [${process.env.ORG_NAME} Events Calendar](${process.env.CALENDAR_LINK})\r\n📅  [Source Event](${event.htmlLink})\r\n📩[Copy to Your Calendar](${copyToMyCalendarURL})`
    }
  ]
  console.log({event:'generated-message', eventId: event.id})
  return {message, embeds}
}

const registerCallback = (newCallback, replace = true) => {
  if(replace)
    callbacks = [newCallback]
  else 
    callbacks.push(callback)
}


module.exports = {trackEvents, registerCallback}