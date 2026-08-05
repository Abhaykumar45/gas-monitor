const express = require("express");

const router = express.Router();

const auth = require("../middleware/authMiddleware");

const { sendCommand } = require("../controllers/commandController");

router.post("/", auth, sendCommand);

module.exports = router;