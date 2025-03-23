const express = require("express");
const app = express();
const dotenv = require("dotenv");
const cookieParser = require("cookie-parser");
const { slowDown } = require("express-slow-down");
const { rateLimit } = require("express-rate-limit");
const proxyRoute = require("../loadbalancer/routes/proxy");

dotenv.config();
const port = process.env.PORT || 3000;

// Connect to MongoDB (using your config file)
require("./src/config/db")();

// Middleware
const { ErrorHandler } = require("./src/middleware/errorHandler");
// const { checkForAuthentication } = require("./src/middleware/authentication");

// app.use(cors());
app.use("/", proxyRoute);
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
// app.use();
const downloadLimiter = slowDown({
  windowMs: 60 * 1000, // slower reset after every 5 minutes
  delayAfter: 5,
  delayMs: (hits) => hits * 100,
});
const rateLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  limit: 100,
  standardHeaders: "draft-8",
  legacyHeaders: false,
});
app.use(rateLimiter);

// importing routes
const fileRoutes = require("./src/routes/fileRoutes");
const userRoutes = require("./src/routes/userRoutes");
const pdfRoute = require("./src/routes/pdfRoute");

// Routes

app.get("/", (req, res) => {
  res.send("helo");
});
app.use("/api/user", userRoutes);
app.use("/api/files", downloadLimiter, fileRoutes);
app.use("/api/pdf", pdfRoute);

// error handlers
app.use(ErrorHandler);
app.use((err, req, res, next) => {
  return res.status(500).json({ msg: `Something's Broke !!`, err: `${err}` });
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
