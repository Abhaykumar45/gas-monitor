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

    if (!user || !user.expoPushToken) {
      console.log("No Push Token Found");
      return;
    }

    if (!Expo.isExpoPushToken(user.expoPushToken)) {
      console.log("Invalid Expo Push Token");
      return;
    }

    const message = {
      to: user.expoPushToken,
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
    };

    await expo.sendPushNotificationsAsync([message]);

    console.log("✅ Push Notification Sent");
  } catch (err) {
    console.log("Notification Error:", err.message);
  }
}

module.exports = {
  sendNotification,
};