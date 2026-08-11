const mqtt = require("mqtt");
const Device = require("../models/Device");
const Alert = require("../models/Alert");
const { sendNotification } = require("../services/notificationService");

function startMQTT(io) {

    const client = mqtt.connect(process.env.MQTT_URL);

    const notificationCooldown = {};

    const COOLDOWN = 5 * 60 * 1000; // 5 Minutes

    client.on("connect", () => {

        console.log("✅ MQTT Connected");

        client.subscribe("sensor/+/gas");
client.subscribe("sensor/+/relay");

console.log("Subscribed : sensor/+/gas");
console.log("Subscribed : sensor/+/relay");

    });

    client.on("message", async (topic, message) => {

        try {

            // Parse JSON Payload
            const data = JSON.parse(message.toString());

            // Extract Device ID from Topic
            const deviceId = topic.split("/")[1];
            const topicType = topic.split("/")[2];


            console.log("--------------------------------");
            console.log("Topic :", topic);
            console.log("Device :", deviceId);
            console.log("Payload :", data);

            // Find Registered Device
            const device = await Device.findOne({ deviceId });

            if (!device) {

                console.log(`❌ Unknown Device : ${deviceId}`);

                return;

            }
            if (topicType === "relay") {

    device.relay = data.relay;
    device.status = "online";
    device.lastSeen = new Date();

    await device.save();

    io.to(device.userId.toString()).emit("gas-data", {
        deviceId: device.deviceId,
        relay: device.relay,
        status: "online",
        lastSeen: device.lastSeen,
    });

    console.log("Relay Status Updated");

    return;
}

            // Update Device Status
            device.gas= data.gas;
            device.alertState = level;
            device.status = "online";
            device.lastSeen = new Date();

            await device.save();
console.log("Sending Socket to:", device.userId.toString());
            // Send Live Data (temporary)
   io.to(device.userId.toString()).emit("gas-data", {
    deviceId: device.deviceId,
    gas: data.gas,
    relay: device.relay,
    valve: device.valve,
    alertState: device.alertState,
    mode: device.mode,
    status: "online",
    lastSeen: device.lastSeen,
});

            // Determine Alert Level
            // Determine Alert Level
let level = "Normal";

if (data.gas >= 900) {

    level = "Critical";

} else if (data.gas >= 300) {

    level = "Warning";
}

// Update Device Alert State
device.alertState = level;

await device.save();

console.log(`Gas: ${data.gas} | Alert State: ${level}`);

// Save Alert only for Warning/Critical
if (level !== "Normal") {

    await Alert.create({

        deviceId,

        gas: data.gas,

        level

    });

    console.log(`Alert Saved (${level})`);
}

            // Critical Notification
            if (level === "Critical") {

                const now = Date.now();

                if (
                    !notificationCooldown[deviceId] ||
                    now - notificationCooldown[deviceId] > COOLDOWN
                ) {

                    await sendNotification(
                        deviceId,
                        data.gas,
                        level
                    );

                    notificationCooldown[deviceId] = now;

                }

            }

        } catch (err) {

            console.log("MQTT Error:", err.message);

        }

    });

    client.on("error", (err) => {

        console.log("MQTT Connection Error:", err.message);

    });

}

module.exports = startMQTT;