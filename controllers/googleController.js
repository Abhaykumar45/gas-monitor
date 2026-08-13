const Device = require("../models/Device");
const jwt = require("jsonwebtoken");

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

        const decoded = getUserFromToken(req);
        const userId = decoded.id;

        const intent = req.body.inputs?.[0]?.intent;

        console.log("========== GOOGLE HOME ==========");
        console.log("Intent:", intent);
        console.log("User:", userId);

        // =========================
        // SYNC
        // =========================

        if (intent === "action.devices.SYNC") {

            const devices = await Device.find({
                userId: userId
            });

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

        // =========================
        // DISCONNECT
        // =========================

        if (intent === "action.devices.DISCONNECT") {

            return res.json({});
        }

        return res.status(400).json({
            error: "Unsupported intent"
        });

    } catch (err) {

        console.log("Google Home Error:", err.message);

        return res.status(401).json({
            error: "Unauthorized"
        });

    }
};