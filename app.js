/******************************************
 * Primary Application File - app.js
 ******************************************/

// Load Environment Variables
require("dotenv").config();

/* ***********************
 * Module Imports
 *************************/
const express = require("express");
const expressLayouts = require("express-ejs-layouts");
const session = require("express-session");
const flash = require("connect-flash");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const pgSession = require("connect-pg-simple")(session);

/* ***********************
 * Custom Modules
 *************************/
const staticRoutes = require("./routes/static");
const baseController = require("./controllers/baseController");
const inventoryRoute = require("./routes/inventoryRoute");
const accountRoute = require("./routes/accountRoute");
const messageRoute = require("./routes/messageRoute");
const intentionalErrorRoute = require("./routes/intentionalErrorRoute");
const cartRoute = require("./routes/cart");
const utilities = require("./utilities");
const pool = require("./database");

/* ***********************
 * App Setup
 *************************/
const app = express();

/* ***********************
 * Session Configuration
 *************************/
app.use(
  session({
    store: new pgSession({
      pool,
      createTableIfMissing: true,
    }),
    secret: process.env.SESSION_SECRET,
    resave: true,
    saveUninitialized: true,
    name: "sessionId",
  })
);

/* ***********************
 * Middleware
 *************************/
// Flash Messages
app.use(flash());
app.use((req, res, next) => {
  res.locals.messages = require("express-messages")(req, res);
  next();
});

// Body & Cookie Parsers
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

// Theme Middleware
app.use((req, res, next) => {
  res.locals.theme = req.cookies.theme === "dark" ? "dark" : "light";
  next();
});

// Static Files
app.use(express.static("public"));
app.use("/images/vehicles", express.static("public/images/vehicles"));

// JWT Middleware
app.use(utilities.checkJWTToken);

/* ***********************
 * View Engine
 *************************/
app.set("view engine", "ejs");
app.use(expressLayouts);
app.set("layout", "./layouts/layout");

/* ***********************
 * Routes
 *************************/
// Static and Base Routes
app.use(staticRoutes);
app.get("/", utilities.handleErrors(baseController.buildHome));

// Functional Routes
app.use("/inv", inventoryRoute);
app.use("/account", accountRoute);
app.use("/message", messageRoute);
app.use("/ierror", intentionalErrorRoute);
app.use("/cart", cartRoute);

// Theme Toggle Route
app.get("/toggle-theme", (req, res) => {
  const newTheme = req.cookies.theme === "dark" ? "light" : "dark";
  res.cookie("theme", newTheme, {
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    httpOnly: true,
  });
  res.redirect("back");
});

/* ***********************
 * 404 Handler
 *************************/
app.use((req, res, next) => {
  next({
    status: 404,
    message: "Unfortunately, we don't have that page in stock.",
  });
});

/* ***********************
 * Global Error Handler
 *************************/
app.use(async (err, req, res, next) => {
  const nav = await utilities.getNav();
  const status = err.status || 500;
  const message =
    status === 404
      ? err.message
      : "Oh no! There was a crash. Maybe try a different route?";
  console.error(`❌ Error at "${req.originalUrl}": ${err.message}`);
  res.status(status).render("errors/error", {
    title: status,
    message,
    nav,
  });
});

/* ***********************
 * Server Start
 *************************/
const PORT = process.env.PORT || 5500;
const HOST = process.env.HOST || "localhost";

app.listen(PORT, HOST, () => {
  console.log(`✅ App running at http://${HOST}:${PORT}`);
});
