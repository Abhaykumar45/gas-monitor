const express = require("express");
const router = express.Router();

const {
    relayControl,
} = require("../controllers/alexaController");

router.post("/relay", relayControl);

module.exports = router;