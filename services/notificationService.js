const { Expo } = require("expo-server-sdk");
const User = require("../models/User");
const Device = require("../models/Device");

const expo = new Expo();

async function sendNotification(deviceId, gas, level) {
  try {
    // Find the device
    const device = await Device.findOne({ deviceId });

    if (!device) {
      console.log("Device not found");
      return;
    }

    // Find the owner
    const user = await User.findById(device.userId);

    if (!user || !user.expoPushTokens || user.expoPushTokens.length === 0) {
      console.log("No Push Tokens Found");
      return;
    }

    // Keep only valid Expo push tokens
    const validTokens = user.expoPushTokens.filter((token) =>
      Expo.isExpoPushToken(token)
    );

    if (validTokens.length === 0) {
      console.log("No Valid Expo Push Tokens Found");
      return;
    }

    // Create a message for every device
    const messages = validTokens.map((token) => ({
      to: token,
      sound: "default",

      title:
        level === "Critical"
          ? "🚨 Critical Gas Leak"
          : "⚠️ Gas Warning",

      body:
        level === "Critical"
          ? `Gas level is ${gas} ppm.\nClose the valve immediately!`
          : `Gas level reached ${gas} ppm.`,

      data: {
        deviceId,
        gas,
        level,
      },
    }));

    // Send notification to all devices
    const chunks = expo.chunkPushNotifications(messages);

    for (const chunk of chunks) {
      await expo.sendPushNotificationsAsync(chunk);
    }

    console.log(
      `✅ Push Notification Sent to ${validTokens.length} device(s)`
    );

  } catch (err) {
    console.log("Notification Error:", err.message);
  }
}

module.exports = {
  sendNotification,
};