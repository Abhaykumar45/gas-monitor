exports.relayControl = async (req, res) => {

    try {

        const {
            deviceName,
            action,
        } = req.body;

        console.log("Alexa Request");
        console.log(deviceName);
        console.log(action);

        return res.json({

            success: true,

            speech: `${deviceName} relay ${action}`

        });

    } catch (err) {

        res.status(500).json({

            success: false,

            speech: "Something went wrong"

        });

    }

};