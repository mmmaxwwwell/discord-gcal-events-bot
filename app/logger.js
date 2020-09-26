const DEBUG = process.env.DEBUG.toLowerCase() === "true"
const log = (args) => {
  if(DEBUG)
    console.log(args)
}
module.exports = { log }