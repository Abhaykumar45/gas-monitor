const Device = require("../models/Device");
const jwt = require("jsonwebtoken");
const { publishCommand } = require("../mqtt/mqttPublisher");

const getUserFromToken = (req) => {

    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        throw new Error("Unauthorized");
    }

    const token = authHeader.split(" ")[1];

    return jwt.verify(
        token,
        process.env.JWT_SECRET
    );
};


exports.googleFulfillment = async (req, res) => {

    try {
        console.log(
    "========== GOOGLE RAW REQUEST =========="
);

console.log(
    JSON.stringify(req.body, null, 2)
);

        const decoded = getUserFromToken(req);
        const userId = decoded.id;

        const intent = req.body.inputs?.[0]?.intent;

        console.log("========== GOOGLE HOME ==========");
        console.log("Intent:", intent);
        console.log("User:", userId);

        // =====================================
        // SYNC
        // =====================================

        if (intent === "action.devices.SYNC") {

            const devices = await Device.find({
                userId: userId
            });
         console.log(
    "DEVICES FOUND:",
    devices.map(device => ({
        id: device.deviceId,
        name: device.deviceName,
        relay: device.relay,
        status: device.status
    }))
);
            const googleDevices = devices.map(device => ({

                id: device.deviceId,

                type: "action.devices.types.SWITCH",

                traits: [
                    "action.devices.traits.OnOff"
                ],

                name: {
                    name: device.deviceName
                },

                willReportState: false,

                roomHint: device.location || undefined,

                deviceInfo: {
                    manufacturer: "Smart Gas",
                    model: "Gas Monitor",
                    hwVersion: "1.0",
                    swVersion: "1.0"
                }

            }));

            return res.json({

                requestId: req.body.requestId,

                payload: {

                    agentUserId: userId.toString(),

                    devices: googleDevices

                }

            });
        }


        // =====================================
        // EXECUTE
        // =====================================

        if (intent === "action.devices.EXECUTE") {

            const commands =
                req.body.inputs[0].payload.commands;

            const results = [];

            for (const command of commands) {

                const devices = command.devices;

                const execution =
                    command.execution[0];

                for (const googleDevice of devices) {

                    const device = await Device.findOne({

                        deviceId: googleDevice.id,

                        userId: userId

                    });

                    if (!device) {

                        results.push({

                            ids: [googleDevice.id],

                            status: "ERROR",

                            errorCode: "deviceNotFound"

                        });

                        continue;

                    }

                    let relay;

                    if (
                        execution.command ===
                        "action.devices.commands.OnOff"
                    ) {

                        relay = execution.params.on
                            ? 1
                            : 0;

                    } else {

                        results.push({

                            ids: [googleDevice.id],

                            status: "ERROR",

                            errorCode: "functionNotSupported"

                        });

                        continue;
                    }


                    // Send relay command through MQTT
                    publishCommand(
                        device.deviceId,
                        {
                            relay: relay,
                            valve: device.valve,
                            mode: device.mode
                        }
                    );


                    // Update database
                    device.relay = relay === 1;

                    await device.save();


                    console.log(
                        `Google Home: ${device.deviceName} relay ${
                            relay === 1 ? "ON" : "OFF"
                        }`
                    );


                    results.push({

                        ids: [device.deviceId],

                        status: "SUCCESS",

                        states: {

                            online: device.status === "online",

                            on: relay === 1

                        }

                    });

                }
            }

            return res.json({

                requestId: req.body.requestId,

                payload: {
                    commands: results
                }

            });
        }
        // =====================================
// QUERY
// =====================================

if (intent === "action.devices.QUERY") {

    const requestedDevices =
        req.body.inputs[0].payload.devices;

    const deviceStates = {};

    for (const googleDevice of requestedDevices) {

        const device = await Device.findOne({
            deviceId: googleDevice.id,
            userId: userId
        });

        if (!device) {

            deviceStates[googleDevice.id] = {
                online: false
            };

            continue;
        }

        deviceStates[googleDevice.id] = {

            online: device.status === "online",

            on: device.relay === true

        };
    }
    console.log(
    "QUERY RESPONSE:",
    JSON.stringify(deviceStates, null, 2)
);

    return res.json({

        requestId: req.body.requestId,

        payload: {

            devices: deviceStates

        }

    });
}


        // =====================================
        // DISCONNECT
        // =====================================

        if (intent === "action.devices.DISCONNECT") {

            return res.json({});
        }


        return res.status(400).json({

            error: "Unsupported intent"

        });

    } catch (err) {

        console.log(
            "Google Home Error:",
            err.message
        );

        return res.status(401).json({

            error: "Unauthorized"

        });

    }

};
