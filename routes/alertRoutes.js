const express = require("express");
const router = express.Router();

const auth = require("../middleware/authMiddleware");
const { getAlerts } = require("../controllers/alertController");

router.get("/:deviceId", auth, getAlerts);

module.exports = router;