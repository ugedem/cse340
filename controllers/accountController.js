const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const utilities = require("../utilities");
const accountModel = require("../models/account-model");
const messageModel = require("../models/message-model");

dotenv.config();

const accountController = {};

// Login View
accountController.buildLogin = async (req, res) => {
  const nav = await utilities.getNav();
  res.render("account/login", {
    title: "Login",
    nav,
    errors: null,
    account_email: "",
  });
};

// Register View
accountController.buildRegister = async (req, res) => {
  const nav = await utilities.getNav();
  res.render("account/register", {
    title: "Register",
    nav,
    errors: null,
    account_firstname: "",
    account_lastname: "",
    account_email: "",
  });
};

// Register New Account
accountController.registerAccount = async (req, res) => {
  const nav = await utilities.getNav();
  const { account_firstname, account_lastname, account_email, account_password } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(account_password, 10);
    const regResult = await accountModel.registerAccount(account_firstname, account_lastname, account_email, hashedPassword);

    if (regResult) {
      req.flash("notice", `Congratulations, ${account_firstname}. You're registered. Please log in.`);
      return res.status(201).redirect("/account/login");
    }

    throw new Error("Registration failed");
  } catch (err) {
    console.error("Registration Error:", err);
    req.flash("notice", "An error occurred during registration.");
    res.status(500).render("account/register", {
      title: "Register",
      nav,
      errors: null,
      account_firstname,
      account_lastname,
      account_email,
    });
  }
};

// Login Process
accountController.accountLogin = async (req, res) => {
  const nav = await utilities.getNav();
  const { account_email, account_password } = req.body;

  try {
    const accountData = await accountModel.getAccountByEmail(account_email);
    if (!accountData) {
      req.flash("notice", "Please check your credentials and try again.");
      return res.status(400).render("account/login", { title: "Login", nav, errors: null, account_email });
    }

    const isMatch = await bcrypt.compare(account_password, accountData.account_password);
    if (!isMatch) {
      req.flash("notice", "Incorrect password.");
      return res.status(400).render("account/login", { title: "Login", nav, errors: null, account_email });
    }

    delete accountData.account_password;
    const token = jwt.sign(accountData, process.env.ACCESS_TOKEN_SECRET, { expiresIn: "1h" });
    res.cookie("jwt", token, { httpOnly: true, maxAge: 3600000 });
    res.redirect("/account");
  } catch (err) {
    console.error("Login Error:", err);
    req.flash("notice", "Login process failed.");
    res.status(500).render("account/login", { title: "Login", nav, errors: null, account_email });
  }
};

// Logout
accountController.logout = (req, res) => {
  res.clearCookie("jwt");
  res.redirect("/");
};

// Account Management View
accountController.buildAccountManagement = async (req, res) => {
  const nav = await utilities.getNav();
  const accountData = res.locals.accountData;

  try {
    const unread = await messageModel.countUnreadMessages(accountData.account_id);
    res.render("account/account-management", {
      title: "Account Management",
      nav,
      accountData,
      errors: null,
      unread,
    });
  } catch (err) {
    console.error("Dashboard Load Error:", err);
    res.status(500).render("account/account-management", {
      title: "Account Management",
      nav,
      accountData,
      errors: null,
      unread: 0,
    });
  }
};

// Build Update Account View
accountController.buildUpdateAccount = async (req, res) => {
  const nav = await utilities.getNav();
  const loggedInAccount = res.locals.accountData;
  const accountId = req.params.account_id || loggedInAccount.account_id;

  try {
    if (req.params.account_id && loggedInAccount.account_type !== "Admin") {
      req.flash("notice", "Access denied. Admins only.");
      return res.redirect("/account");
    }

    const accountDataToEdit = await accountModel.getAccountById(accountId);
    if (!accountDataToEdit) {
      req.flash("notice", "Account not found.");
      return res.redirect("/account");
    }

    res.render("account/update", {
      title: "Update Account",
      nav,
      errors: null,
      ...accountDataToEdit,
    });
  } catch (err) {
    console.error("Error loading account update form:", err);
    req.flash("notice", "Unable to load update form.");
    res.redirect("/account");
  }
};

// Update Account Info
accountController.updateAccount = async (req, res) => {
  const nav = await utilities.getNav();
  const { account_id, account_firstname, account_lastname, account_email } = req.body;

  try {
    const result = await accountModel.updateAccount(account_id, account_firstname, account_lastname, account_email);
    if (!result) throw new Error("Update failed");

    req.flash("notice", "Account updated successfully.");
    res.redirect("/account");
  } catch (err) {
    console.error("Update Error:", err);
    req.flash("notice", "Update failed.");
    res.status(500).render("account/update", {
      title: "Update Account",
      nav,
      errors: null,
      account_id,
      account_firstname,
      account_lastname,
      account_email,
    });
  }
};

// Update Password
accountController.updatePassword = async (req, res) => {
  const nav = await utilities.getNav();
  const { account_id, account_password, account_firstname, account_lastname, account_email } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(account_password, 10);
    const result = await accountModel.updatePassword(account_id, hashedPassword);

    if (!result) throw new Error("Password update failed");

    req.flash("notice", "Password updated successfully.");
    res.redirect("/account");
  } catch (err) {
    console.error("Password Update Error:", err);
    req.flash("notice", "Password update failed.");
    res.status(500).render("account/update", {
      title: "Update Account",
      nav,
      errors: null,
      account_id,
      account_firstname,
      account_lastname,
      account_email,
    });
  }
};

module.exports = accountController;
