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

        const user = await User.findOne({ email });

        if (!user) {

            return res.send("Invalid Email");

        }

        const match = await bcrypt.compare(password, user.password);

        if (!match) {

            return res.send("Invalid Password");

        }

        // Generate Authorization Code
        const code = crypto.randomBytes(32).toString("hex");

        authCodes[code] = user._id.toString();

        // Redirect back to Amazon
        const redirect_uri = req.query.redirect_uri;

        res.redirect(`${redirect_uri}?code=${code}`);

    } catch (err) {

        console.log(err);

        res.send("Login Failed");

    }

};

exports.token = async (req, res) => {

    try {

        const  code  = req.body.code;
        if (req.body.grant_type !== "authorization_code") {
            return res.status(400).json({
                error: "unsupported_grant_type"
            });
        }

        const userId = authCodes[code];

        if (!userId) {
            return res.status(400).json({
                error: "Invalid authorization code"
            });
        }

        delete authCodes[code];

        const accessToken = jwt.sign(
            { id: userId },
            process.env.JWT_SECRET,
            { expiresIn: "30d" }
        );

        res.json({
            access_token: accessToken,
            token_type: "Bearer",
            expires_in: 2592000
        });

    } catch (err) {

        console.log(err);

        res.status(500).json({
            error: "Server Error"
        });

    }

};