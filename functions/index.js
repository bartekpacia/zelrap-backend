const functions = require("firebase-functions")
const request = require("request-promise-native")
const config = require("./config")

const FCM_KEY = config.keys.fcm
const API_KEY = process.keys.stream_api_key
const API_SECRET = process.env.stream_api_secret
const APP_ID = config.keys.stream_app_id

exports.sendLiveNotification = functions.firestore
  .document("celebrities/{celebrity}")
  .onUpdate(async (change, context) => {
    const oldData = change.before.data()
    const newData = change.after.data()

    if (!oldData.isLive && newData.isLive) {
      const message = `${newData.name} has gone live`
      console.log(message)

      await request.post("https://fcm.googleapis.com/fcm/send", {
        headers: {
          "Content-Type": "application/json",
          Authorization: `key=${FCM_KEY}`,
        },
        body: JSON.stringify({
          to: "/topics/live_updates",
          notification: {
            title: `${newData.name} has gone live`,
            body: "Tap to join now!",
          },
        }),
      })
    }
  })

exports.streamApi = functions.https.onRequest(async (req, res) => {
  try {
    const data = req.body

    const client = stream.connect(API_KEY, API_SECRET, APP_ID)

    const username = req.user.sender

    await client.user(username).getOrCreate({ name: username })
    const token = client.createUserToken(username)

    res.status(200).json({ token, API_KEY, APP_ID })
  } catch (error) {
    console.log(error)
    res.status(500).json({ error: error.message })
  }
})
