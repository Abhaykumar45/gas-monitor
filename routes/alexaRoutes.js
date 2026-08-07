const express = require("express");
const router = express.Router();

const {
    relayControl,getGasStatus,checkAllDevices
} = require("../controllers/alexaController");

router.post("/relay", relayControl);
router.post("/gas-status", getGasStatus);
router.post("/check-all", checkAllDevices);
module.exports = router;