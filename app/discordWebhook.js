const sendMessage = (message) => {
  console.log({event: 'sending-message', message})
}

module.exports = { sendMessage }