const functions = require("firebase-functions")
const request = require("request-promise-native")
const admin = require("firebase-admin")
const stream = require("getstream")
const crypto = require("crypto")
const config = require("./config")

const FCM_KEY = config.keys.fcm
const API_KEY = config.keys.stream_api_key
const API_SECRET = config.keys.stream_api_secret
const APP_ID = config.keys.stream_app_id

admin.initializeApp()

const generateUserToken = () => crypto.randomBytes(32).toString("base64")

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

exports.streamFeedCredentials = functions.https.onRequest(async (req, res) => {
  try {
    const data = req.body

    const client = stream.connect(API_KEY, API_SECRET, APP_ID)

    const username = req.user.sender

    await client.user(username).getOrCreate({ name: username })
    const token = client.createUserToken(username)

    return res.status(200).json({ token, API_KEY, APP_ID })
  } catch (error) {
    console.log(error)
    return res.status(500).json({ error: error.message })
  }
})

exports.authenticate = functions.https.onRequest(async (req, res) => {
  if (!req.body || !req.body.sender) {
    res.statusMessage = "You should specify sender in body"
    res.status(400).end()
    return null
  }
  const token = generateUserToken()

  const username = req.body.sender

  const querySnapshot = await admin
    .firestore()
    .collection("users")
    .where("sender", "==", username)
    .get()

  for (const doc of querySnapshot.docs) {
    console.log(`doc.data: ${doc.data()}`)

    if (doc.data().sender === username) {
      console.log("USER EXIST")
    }
  }

  await admin.firestore().collection("users").doc(token).set({
    sender: req.body.sender,
  })

  return res.json({ authToken: token })
})

exports.getUsers = functions.https.onRequest(async (req, res) => {
  const snapshot = await admin.firestore().collection("users").get()
  const users = snapshot.data()

  const senders = []

  for (const user in users) {
    senders.push(user.sender)
  }

  return res.json({ users: senders })
})
