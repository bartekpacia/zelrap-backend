const functions = require("firebase-functions")
const request = require("request-promise-native")
const config = require("./config")

const FCM_KEY = config.keys.fcm

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
