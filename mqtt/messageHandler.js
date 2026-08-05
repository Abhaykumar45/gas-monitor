const Alert = require("../models/Alert");
const Device = require("../models/Device");

const { sendNotification } = require("../services/notificationService");

const WARNING_LEVEL = 300;
const CRITICAL_LEVEL = 900;

// Notification spam se bachne ke liye
const notificationCooldown = {};
const COOLDOWN_TIME = 1 * 60 * 1000; // 5 minutes

async function handleMessage(io, topic, message) {

    try {

        const data = JSON.parse(message.toString());

        const {
            deviceId,
            gas,
            relay,
            temperature,
            battery,
            mode,
            valve,
            alert
        } = data;

        // Required fields check
        if (!deviceId || gas === undefined) {

            console.log("Invalid MQTT Data");
            return;

        }

        // Find device
        const device = await Device.findOne({ deviceId });
        console.log("Device Found:", device);
        if (!device) {

            console.log("Unknown Device:", deviceId);
            return;

        }

        // Update latest device status
        device.gas = gas;
        device.lastHeat = temperature;
        device.relay = relay;
        device.mode = mode;
        device.valve = valve;
        device.alert = alert;
        device.status = "online";
        device.lastSeen = new Date();

        await device.save();

        // Send live data only to device owner
        io.to(device.userId.toString()).emit("gas-data", data);
        console.log("Sending Socket Data:", data);

        // Warning Alert
      let currentState = "Normal";

if (gas >= CRITICAL_LEVEL) {

    currentState = "Critical";

}
else if (gas >= WARNING_LEVEL) {

    currentState = "Warning";

}

// Only act if alert state changed
if (device.alertState !== currentState) {

    device.alertState = currentState;

    await device.save();

    if (currentState !== "Normal") {

        await Alert.create({

            deviceId,
            gas,
            level: currentState

        });

        console.log(`${currentState} Alert Saved`);

    }

    if (currentState === "Critical") {

        const now = Date.now();

        if (
            !notificationCooldown[deviceId] ||
            now - notificationCooldown[deviceId] > COOLDOWN_TIME
        ) {

            await sendNotification(deviceId, gas);

            notificationCooldown[deviceId] = now;


            }

        }

    }
}catch (error) {

        console.log("Message Error:", error.message);

    }

}

module.exports = handleMessage;