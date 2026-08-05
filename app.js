const express = require("express");

const cors = require("cors");
const authRoutes =require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const deviceRoutes =require("./routes/deviceRoutes");
const commandRoutes = require("./routes/commandRoutes");
const alertRoutes=require("./routes/alertRoutes");
const dashboardRoutes=require("./routes/dashboardRoutes");
const app = express();

app.use(cors());

app.use(express.json());
// app.get("/health", (req, res) => {
//   res.json({
//     success: true,
//     message: "Backend is running",
//   });
// });
app.use(
    "/api/dashboard",
   dashboardRoutes
);

app.use("/api/auth",authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/device",deviceRoutes);
// app.use("/api/alerts", alertRoutes);
app.use("/api/device/command", commandRoutes);
app.use("/api/alerts", alertRoutes);
module.exports = app;