const https = require('https')
const axios = require('axios')

const sendMessage = async ({message, embeds}) => {
  axios.post(process.env.DISCORD_WEBHOOK_URL, {
    "username": process.env.DISCORD_BOT_NAME,
    "avatar_url": "",
    "content": message, 
    embeds
  })
}

module.exports = { sendMessage }