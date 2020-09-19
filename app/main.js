const webhook = require("./discordWebhook")
const eventTracker = require("./eventTracker")
const gcal = require("./gcal")
const console = require('./logger')

const update = async () => {
  eventTracker.trackEvents(await gcal.listEvents())
}

(async () => {
  try {
    eventTracker.registerCallback(webhook.sendMessage)
    update()
    setInterval(update, 1000 * 60 * 15)
  } catch (error) {
      console.log({event: 'unhandled-exception', error})
  }
})()
