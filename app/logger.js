const DEBUG = process.env.DEBUG.toLowerCase() === "true"
const log = (event, rest) => {
  if(DEBUG)
    console.log({event, ...rest})
}
module.exports = { log }