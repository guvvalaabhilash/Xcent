const connectDB = require("./config/db");

const PORT = process.env.PORT || 5000;

connectDB().then((dbConnected) => {
  process.env.DB_AVAILABLE = dbConnected ? "true" : "false";
  const app = require("./app");
  app.listen(PORT, () => {
    const mode = dbConnected ? "database" : "demo (in-memory)";
    console.log(`Server running at http://localhost:${PORT} in ${mode} mode`);
  });
});
