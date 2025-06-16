// routes/cart.js
const express = require("express");
const router = express.Router();
const cartController = require("../controllers/cartController");
const utilities = require("../utilities/index");

// Add to cart
router.post("/add", utilities.handleErrors(cartController.addToCart));

// View cart
router.get("/view", utilities.handleErrors(cartController.viewCart));

// Clear cart (optional but helpful)
router.post("/clear", utilities.handleErrors(cartController.clearCart));

module.exports = router;
