exports.authorize = async (req, res) => {

    res.redirect("/oauth/login");

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

            <form method="POST" action="/oauth/login">

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

    res.send("Login coming in next step...");

};

exports.token = async (req, res) => {

    res.json({

        access_token: "temporary",

        token_type: "Bearer",

        expires_in: 3600

    });

};