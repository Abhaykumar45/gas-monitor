const User = require("../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

// Temporary storage (we'll replace this with Redis or MongoDB later)
const authCodes = {};



exports.authorize = async (req, res) => {

    const redirect_uri = req.query.redirect_uri;

    res.redirect(
        `/oauth/login?redirect_uri=${encodeURIComponent(redirect_uri)}`
    );

};

exports.loginPage = async (req, res) => {

    res.send(`
        <html>

        <head>

            <title>Smart Gas Login</title>

        </head>

        <body style="font-family:Arial;text-align:center;margin-top:100px">

            <h1>Smart Gas</h1>

            <h3>Alexa Account Linking</h3>

            <form method="POST" action="/oauth/login?redirect_uri=${encodeURIComponent(req.query.redirect_uri || "")}">

                <input
                    type="email"
                    name="email"
                    placeholder="Email"
                />

                <br><br>

                <input
                    type="password"
                    name="password"
                    placeholder="Password"
                />

                <br><br>

                <button type="submit">

                    Login

                </button>

            </form>

        </body>

        </html>
    `);

};

exports.loginUser = async (req, res) => {

    try {

        const { email, password } = req.body;

        const cleanEmail = email.trim().toLowerCase();

        const user = await User.findOne({
            email: { $regex: new RegExp(`^${cleanEmail}$`, "i") }
        });

        if (!user) {

            return res.send("Invalid Email or Password");

        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {

            return res.send("Invalid Email or Password");

        }

        const code = crypto.randomBytes(32).toString("hex");

        authCodes[code] = user._id.toString();

        const redirect_uri = req.query.redirect_uri;

        return res.redirect(`${redirect_uri}?code=${code}`);

    } catch (err) {

        console.log(err);

        return res.send("Login Failed");

    }

};

exports.token = async (req, res) => {

    try {

        const auth = req.headers.authorization;

        if (!auth || !auth.startsWith("Basic ")) {

            return res.status(401).json({
                error: "invalid_client"
            });

        }

        const base64 = auth.split(" ")[1];

        const credentials = Buffer.from(base64, "base64")
            .toString("utf8");

        const [clientId, clientSecret] = credentials.split(":");

        if (
            clientId !== "smartgas-client" ||
            clientSecret !== "smartgas-secret-2026"
        ) {

            return res.status(401).json({
                error: "invalid_client"
            });

        }

        const code = req.body.code;

        const userId = authCodes[code];

        if (!userId) {

            return res.status(400).json({
                error: "invalid_grant"
            });

        }

        delete authCodes[code];

        const accessToken = jwt.sign(

            { id: userId },

            process.env.JWT_SECRET,

            { expiresIn: "30d" }

        );

        return res.json({

            access_token: accessToken,

            token_type: "Bearer",

            expires_in: 2592000

        });

    } catch (err) {

        console.log(err);

        return res.status(500).json({

            error: "server_error"

        });

    }

};