const functions = require("firebase-functions")
const fs = require("fs")

let config = functions.config().env

if (fs.existsSync("./env.json")) {
  const env = require("./env.json")

  config = env
}

module.exports = config
