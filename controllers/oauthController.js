const User = require("../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

// Temporary authorization-code storage
// Later we can move this to Redis/MongoDB.
const authCodes = {};

// ==========================================
// AUTHORIZE
// ==========================================

exports.authorize = async (req, res) => {

    try {

        const {
            redirect_uri,
            state,
            client_id,
            scope,
            response_type
        } = req.query;

        console.log("========== AUTHORIZE ==========");
        console.log("Client ID:", client_id);
        console.log("Redirect URI:", redirect_uri);
        console.log("State:", state);
        console.log("Scope:", scope);
        console.log("Response Type:", response_type);

        if (!redirect_uri) {

            return res.status(400).send(
                "Missing redirect_uri"
            );

        }

        // Send everything to login page
        const loginUrl =
            `/oauth/login?redirect_uri=${encodeURIComponent(redirect_uri)}` +
            `&state=${encodeURIComponent(state || "")}` +
            `&client_id=${encodeURIComponent(client_id || "")}` +
            `&scope=${encodeURIComponent(scope || "")}`;

        return res.redirect(loginUrl);

    } catch (err) {

        console.log("Authorize Error:", err);

        return res.status(500).send(
            "Authorization failed"
        );

    }

};


// ==========================================
// LOGIN PAGE
// ==========================================

exports.loginPage = async (req, res) => {

    const {
        redirect_uri,
        state,
        client_id,
        scope
    } = req.query;

    res.send(`

        <html>

        <head>

            <title>Smart Gas Login</title>

        </head>

        <body
            style="
                font-family:Arial;
                text-align:center;
                margin-top:100px
            "
        >

            <h1>Smart Gas</h1>

            <h3>Connect your Smart Gas account</h3>

            <form method="POST" action="/oauth/login">

                <input
                    type="hidden"
                    name="redirect_uri"
                    value="${redirect_uri || ""}"
                />

                <input
                    type="hidden"
                    name="state"
                    value="${state || ""}"
                />

                <input
                    type="hidden"
                    name="client_id"
                    value="${client_id || ""}"
                />

                <input
                    type="hidden"
                    name="scope"
                    value="${scope || ""}"
                />

                <input
                    type="email"
                    name="email"
                    placeholder="Email"
                    required
                />

                <br><br>

                <input
                    type="password"
                    name="password"
                    placeholder="Password"
                    required
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


// ==========================================
// LOGIN USER
// ==========================================

exports.loginUser = async (req, res) => {

    try {

        const {
            email,
            password,
            redirect_uri,
            state,
            client_id,
            scope
        } = req.body;

        if (!email || !password) {

            return res.send(
                "Email and Password are required"
            );

        }

        if (!redirect_uri) {

            return res.send(
                "Missing redirect URI"
            );

        }

        const cleanEmail =
            email.trim().toLowerCase();

        const user = await User.findOne({

            email: {
                $regex:
                    new RegExp(
                        `^${cleanEmail}$`,
                        "i"
                    )
            }

        });

        if (!user) {

            return res.send(
                "Invalid Email or Password"
            );

        }

        const isMatch =
            await bcrypt.compare(
                password,
                user.password
            );

        if (!isMatch) {

            return res.send(
                "Invalid Email or Password"
            );

        }

        // ======================================
        // Generate one-time authorization code
        // ======================================

        const code =
            crypto.randomBytes(32).toString("hex");

        authCodes[code] = {

            userId:
                user._id.toString(),

            clientId:
                client_id,

            redirectUri:
                redirect_uri,

            scope:
                scope,

            createdAt:
                Date.now()

        };

        console.log(
            "Authorization code created for:",
            client_id
        );

        console.log(
            "Redirecting to:",
            redirect_uri
        );

        // ======================================
        // Redirect back to Google/Alexa
        // ======================================

        const separator =
            redirect_uri.includes("?")
                ? "&"
                : "?";

        const redirectUrl =
            `${redirect_uri}` +
            `${separator}` +
            `code=${encodeURIComponent(code)}` +
            `&state=${encodeURIComponent(state || "")}`;

        console.log(
            "Final Redirect:",
            redirectUrl
        );

        return res.redirect(
            redirectUrl
        );

    } catch (err) {

        console.log(
            "Login Error:",
            err
        );

        return res.send(
            "Login Failed"
        );

    }

};


// ==========================================
// TOKEN
// Supports Alexa + Google
// ==========================================

exports.token = async (req, res) => {

    try {

        console.log(
            "========== TOKEN REQUEST =========="
        );

        console.log(
            "Body:",
            req.body
        );

        console.log(
            "Headers:",
            req.headers
        );


        // =====================================
        // Get client credentials
        // =====================================

        let clientId;
        let clientSecret;

        // -------------------------------------
        // Check HTTP Basic Authentication
        // -------------------------------------

        const authHeader =
            req.headers.authorization;

        if (
            authHeader &&
            authHeader.startsWith("Basic ")
        ) {

            const base64 =
                authHeader.split(" ")[1];

            const credentials =
                Buffer
                    .from(base64, "base64")
                    .toString("utf8");

            const separator =
                credentials.indexOf(":");

            if (separator !== -1) {

                clientId =
                    credentials.substring(
                        0,
                        separator
                    );

                clientSecret =
                    credentials.substring(
                        separator + 1
                    );

            }

        }

        // -------------------------------------
        // If no Basic Auth, get body values
        // -------------------------------------

        if (!clientId) {

            clientId =
                req.body.client_id;

            clientSecret =
                req.body.client_secret;

        }


        console.log(
            "Client ID:",
            clientId
        );


        // =====================================
        // Validate Client
        // =====================================

        const validAlexaClient =
            clientId === "smartgas-client" &&
            clientSecret ===
                "smartgas-secret-2026";

        const validGoogleClient =
            clientId ===
                process.env.GOOGLE_CLIENT_ID &&
            clientSecret ===
                process.env.GOOGLE_CLIENT_SECRET;


        if (
            !validAlexaClient &&
            !validGoogleClient
        ) {

            console.log(
                "Invalid client credentials"
            );

            return res.status(401).json({

                error:
                    "invalid_client"

            });

        }


        // =====================================
        // Google Authorization Code
        // =====================================

        const grantType =
            req.body.grant_type;


        if (
            grantType ===
            "authorization_code"
        ) {

            const code =
                req.body.code;

            if (!code) {

                return res.status(400).json({

                    error:
                        "invalid_grant"

                });

            }


            const storedCode =
                authCodes[code];


            if (!storedCode) {

                return res.status(400).json({

                    error:
                        "invalid_grant"

                });

            }


            // Make sure code belongs
            // to this client

            if (
                storedCode.clientId &&
                storedCode.clientId !== clientId
            ) {

                return res.status(400).json({

                    error:
                        "invalid_grant"

                });

            }


            // One-time authorization code

            delete authCodes[code];


            // Create access token

            const accessToken =
                jwt.sign(

                    {
                        id:
                            storedCode.userId,

                        type:
                            "google_access"

                    },

                    process.env.JWT_SECRET,

                    {
                        expiresIn:
                            "1h"
                    }

                );


            // Create refresh token

            const refreshToken =
                jwt.sign(

                    {
                        id:
                            storedCode.userId,

                        type:
                            "google_refresh"

                    },

                    process.env.JWT_SECRET,

                    {
                        expiresIn:
                            "365d"
                    }

                );


            console.log(
                "Google token generated"
            );


            return res.json({

                access_token:
                    accessToken,

                refresh_token:
                    refreshToken,

                token_type:
                    "Bearer",

                expires_in:
                    3600

            });

        }


        // =====================================
        // Google Refresh Token
        // =====================================

        if (
            grantType ===
            "refresh_token"
        ) {

            const refreshToken =
                req.body.refresh_token;


            if (!refreshToken) {

                return res.status(400).json({

                    error:
                        "invalid_grant"

                });

            }


            let decoded;

            try {

                decoded =
                    jwt.verify(

                        refreshToken,

                        process.env.JWT_SECRET

                    );

            } catch (err) {

                return res.status(400).json({

                    error:
                        "invalid_grant"

                });

            }


            if (
                decoded.type !==
                "google_refresh"
            ) {

                return res.status(400).json({

                    error:
                        "invalid_grant"

                });

            }


            const newAccessToken =
                jwt.sign(

                    {
                        id:
                            decoded.id,

                        type:
                            "google_access"

                    },

                    process.env.JWT_SECRET,

                    {
                        expiresIn:
                            "1h"
                    }

                );


            return res.json({

                access_token:
                    newAccessToken,

                token_type:
                    "Bearer",

                expires_in:
                    3600

            });

        }


        // =====================================
        // OLD ALEXA FLOW
        // =====================================

        if (
            !grantType &&
            req.body.code
        ) {

            const code =
                req.body.code;


            const storedCode =
                authCodes[code];


            if (!storedCode) {

                return res.status(400).json({

                    error:
                        "invalid_grant"

                });

            }


            delete authCodes[code];


            const userId =
                typeof storedCode === "string"

                    ? storedCode

                    : storedCode.userId;


            const accessToken =
                jwt.sign(

                    {
                        id:
                            userId
                    },

                    process.env.JWT_SECRET,

                    {
                        expiresIn:
                            "30d"
                    }

                );


            return res.json({

                access_token:
                    accessToken,

                token_type:
                    "Bearer",

                expires_in:
                    2592000

            });

        }


        return res.status(400).json({

            error:
                "unsupported_grant_type"

        });

    } catch (err) {

        console.log(
            "TOKEN ERROR:",
            err
        );

        return res.status(500).json({

            error:
                "server_error"

        });

    }

};