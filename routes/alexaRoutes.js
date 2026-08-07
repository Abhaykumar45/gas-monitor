const express = require("express");
const router = express.Router();

const {
    relayControl,getGasStatus
} = require("../controllers/alexaController");

router.post("/relay", relayControl);
router.post("/gas-status", getGasStatus);
module.exports = router;