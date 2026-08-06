const express = require("express");
const router = express.Router();

const {
    authorize,
    loginPage,
    loginUser,
    token,
} = require("../controllers/oauthController");

router.get("/authorize", authorize);

router.get("/login", loginPage);

router.post("/login", loginUser);

router.post("/token", token);

module.exports = router;