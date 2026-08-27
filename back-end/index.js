require("dotenv").config({ quiet: true });

const cors = require("cors");
const express = require("express");
const pool = require("./db/connection");

const app = express();
const port = Number(process.env.PORT) || 5000;

app.use(express.json());
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    credentials: true,
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

app.listen(port, () => {
  console.log(`Backend posluša na vratih ${port}`);
});
