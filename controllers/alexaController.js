const Device = require("../models/Device");
const { publishCommand } = require("../services/mqttPublisher");

exports.relayControl = async (req, res) => {

    try {

        const { deviceName, action } = req.body;

        const device = await Device.findOne({
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