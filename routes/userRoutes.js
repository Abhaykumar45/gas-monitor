const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const { profile } = require("../controllers/userController");
const { savePushToken } = require("../controllers/userController");
router.get("/profile", authMiddleware, profile);
router.put(
    "/push-token",
    authMiddleware,
    savePushToken
);
module.exports = router;