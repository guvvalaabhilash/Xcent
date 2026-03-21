const express = require("express");
const cors = require("cors");
const path = require("path");
const errorHandler = require("./middleware/errorHandler");

const app = express();
const useDemoMode = process.env.DB_AVAILABLE !== "true";

app.use(cors());
app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(path.resolve("server/uploads")));
app.use("/", express.static(path.resolve("frontend")));

app.get("/api/health", (req, res) =>
  res.json({ status: "ok", service: "Hospital Management API", mode: useDemoMode ? "demo" : "database" })
);

if (useDemoMode) {
  const demoRoutes = require("./routes/demoRoutes");
  app.use("/api", demoRoutes);
} else {
  const authRoutes = require("./routes/authRoutes");
  const hmsRoutes = require("./routes/hmsRoutes");
  app.use("/api/auth", authRoutes);
  app.use("/api", hmsRoutes);
}

app.use(errorHandler);

module.exports = app;
