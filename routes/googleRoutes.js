const express = require("express");

const router = express.Router();

const {
    googleFulfillment
} = require("../controllers/googleController");

router.post("/fulfillment", googleFulfillment);

module.exports = router;