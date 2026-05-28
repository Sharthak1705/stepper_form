require("dotenv").config();

const express = require("express");
const cors = require("cors");

const { initDB } = require("./init");

const configsRouter = require("./routes/configs");
const submissionsRouter = require("./routes/submissions");

const app = express();



// =========================
// Middlewares
// =========================

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

app.use(express.json());



// =========================
// Routes
// =========================

app.use("/api/configs", configsRouter);

app.use("/api/submissions", submissionsRouter);



// =========================
// Health Check
// =========================

app.get("/api/health", (req, res) => {

  res.json({
    status: "ok",
    message: "Server running"
  });

});



// =========================
// 404 Handler
// =========================

app.use((req, res) => {

  res.status(404).json({
    error: "Route not found"
  });

});



// =========================
// Global Error Handler
// =========================

app.use((err, req, res, next) => {

  console.error("Global Error:", err);

  res.status(500).json({
    error: "Internal server error"
  });

});



// =========================
// Start Server
// =========================

const PORT = process.env.PORT || 3001;

async function startServer() {

  try {

    // Initialize PostgreSQL tables
    await initDB();

    app.listen(PORT, () => {

      console.log(
        `Backend running at http://localhost:${PORT}`
      );

    });

  } catch (error) {

    console.error(
      "Failed to start server:",
      error
    );

    process.exit(1);
  }
}

startServer();
