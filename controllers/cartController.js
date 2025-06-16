// controllers/cartController.js
const utilities = require("../utilities/index");

exports.addToCart = async function (req, res) {
  try {
    const { name, image, price } = req.body;

    if (!name || !price) {
      req.flash("error", "Missing item name or price.");
      return res.redirect("back");
    }

    const cartItem = {
      name: name.trim(),
      image: image || "/images/placeholder.png",
      price: parseFloat(price),
      quantity: 1,
    };

    // Ensure session cart exists
    if (!req.session.cart) req.session.cart = [];

    // Check if item already exists in cart
    const existingItem = req.session.cart.find(item => item.name === cartItem.name);
    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      req.session.cart.push(cartItem);
    }

    req.flash("success", `${cartItem.name} added to cart.`);
    res.redirect("back");
  } catch (err) {
    console.error("Cart Add Error:", err);
    req.flash("error", "There was a problem adding the item to the cart.");
    res.redirect("back");
  }
};

exports.viewCart = async function (req, res) {
  try {
    const nav = await utilities.getNav();
    const cart = req.session.cart || [];

    const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0).toFixed(2);

    res.render("cart/view", {
      title: "Your Cart",
      nav,
      cart,
      total,
    });
  } catch (err) {
    console.error("Cart View Error:", err);
    res.status(500).send("Error displaying cart");
  }
};

exports.clearCart = async function (req, res) {
  req.session.cart = [];
  req.flash("info", "Cart cleared.");
  res.redirect("/cart/view");
};
