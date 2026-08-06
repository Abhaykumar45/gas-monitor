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