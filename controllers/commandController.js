const Device = require("../models/Device");
const { publishCommand } = require("../mqtt/mqttPublisher");

exports.sendCommand = async (req, res) => {

    try {

        const { deviceId, command } = req.body;

        if (!deviceId || !command) {

            return res.status(400).json({
                message: "deviceId and command are required"
            });

        }

        const device = await Device.findOne({

            deviceId,
            userId: req.user.id

        });

        if (!device) {

            return res.status(404).json({

                message: "Device not found"

            });

        }

        publishCommand(deviceId, command);

        res.json({

            success: true,
            message: "Command Sent"

        });

    }

    catch (err) {

        res.status(500).json({

            message: err.message

        });

    }

};