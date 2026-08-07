const Device = require("../models/Device");
const { publishCommand } = require("../mqtt/mqttPublisher");
const jwt = require("jsonwebtoken");
exports.relayControl = async (req, res) => {

    try {
        const authHeader = req.headers.authorization;

if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
        success: false,
        speech: "Please link your Smart Gas account in the Alexa app."
    });
}

let decoded;

try {
    decoded = jwt.verify(
        authHeader.split(" ")[1],
        process.env.JWT_SECRET
    );
} catch (err) {
    return res.status(401).json({
        success: false,
        speech: "Your Smart Gas account is not linked or your session has expired."
    });
}

const userId = decoded.id;

        const { deviceName, action } = req.body;

        const device = await Device.findOne({
                userId: userId,
            deviceName: new RegExp(`^${deviceName}$`, "i")
        });

        if (!device) {

            return res.json({
                success: false,
                speech: `I couldn't find a device named ${deviceName}`
            });

        }

        publishCommand(device.deviceId, {

            relay: action === "on" ? 1 : 0,

            valve: device.valve,

            mode: device.mode

        });

        return res.json({

            success: true,

            speech: `${device.deviceName} relay turned ${action}`

        });

    } catch (err) {

        console.log(err);

        return res.status(500).json({

            success: false,

            speech: "Something went wrong."

        });

    }

};
exports.getGasStatus = async (req, res) => {
    try {

        const authHeader = req.headers.authorization;

        if (!authHeader) {
            return res.status(401).json({
                speech: "Unauthorized"
            });
        }

        const token = authHeader.split(" ")[1];

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const userId = decoded.id;

        const { deviceName } = req.body;

        const device = await Device.findOne({
            userId,
            deviceName: new RegExp(`^${deviceName}$`, "i")
        });

        if (!device) {
            return res.json({
                success: false,
                speech: `I couldn't find a device named ${deviceName}`
            });
        }

        let speech = "";

        if (device.alertState === "Normal") {
            speech = `The gas status in ${device.deviceName} is Normal. Everything is safe.`;
        } else if (device.alertState === "Warning") {
            speech = `The gas status in ${device.deviceName} is Warning. Please check the area.`;
        } else {
            speech = `The gas status in ${device.deviceName} is Critical. Gas leak detected. Please take action immediately.`;
        }

        return res.json({
            success: true,
            speech
        });

    } catch (err) {
        console.log(err);
        return res.status(500).json({
            speech: "Something went wrong"
        });
    }
};
exports.checkAllDevices = async (req, res) => {
    try {

        const authHeader = req.headers.authorization;

        if (!authHeader) {
            return res.status(401).json({
                speech: "Unauthorized"
            });
        }

        const token = authHeader.split(" ")[1];

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.id;

        const devices = await Device.find({ userId });

        if (!devices || devices.length === 0) {
            return res.json({
                speech: "No devices found in your account."
            });
        }

        // Find devices with problem
        const criticalDevices = devices.filter(
            d => d.alertState === "Critical"
        );

        const warningDevices = devices.filter(
            d => d.alertState === "Warning"
        );

        // 🚨 CRITICAL FIRST
        if (criticalDevices.length > 0) {

            const names = criticalDevices.map(d => d.deviceName).join(", ");

            return res.json({
                speech: `Alert! Gas leak detected in ${names}. Please take immediate action.`
            });

        }

        // ⚠️ WARNING
        if (warningDevices.length > 0) {

            const names = warningDevices.map(d => d.deviceName).join(", ");

            return res.json({
                speech: `Warning! Elevated gas levels detected in ${names}. Please check the area.`
            });

        }

        // ✅ SAFE
        return res.json({
            speech: "No gas leak detected. All devices are normal."
        });

    } catch (err) {
        console.log(err);
        return res.status(500).json({
            speech: "Something went wrong."
        });
    }
};