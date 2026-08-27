require("dotenv").config({ quiet: true });

const cors = require("cors");
const express = require("express");
const session = require("express-session");
const pool = require("./db/connection");
const authRoutes = require("./routes/auth");

const app = express();
const port = Number(process.env.PORT) || 5000;

app.use(express.json());
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    credentials: true,
  }),
);
app.use(
  session({
    name: "taborni_arhiv_session",
    secret: process.env.SESSION_SECRET || "local-development-secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      secure: false,
      maxAge: 8 * 60 * 60 * 1000,
    },
  }),
);

app.get("/", (req, res) => {
  res.json({ message: "Taborniški arhiv API" });
});

app.get("/health", async (req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ status: "ok", database: "connected" });
  } catch (error) {
    res.status(503).json({ status: "error", database: "unavailable" });
  }
});

app.use("/auth", authRoutes);

app.listen(port, () => {
  console.log(`Backend posluša na vratih ${port}`);
});
