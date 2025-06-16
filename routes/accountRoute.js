const express = require("express");
const router = express.Router();
const accountController = require("../controllers/accountController");
const utilities = require("../utilities");
const regValidate = require("../utilities/account-validation");

/* ======================
 * View Routes
 * ===================== */

// Login view
router.get("/login", utilities.handleErrors(accountController.buildLogin));

// Register view
router.get("/register", utilities.handleErrors(accountController.buildRegister));

// Account management dashboard (authenticated users only)
router.get("/", utilities.checkLogin, utilities.handleErrors(accountController.buildAccountManagement));

// Account update view (authenticated users only)
router.get("/update", utilities.checkLogin, utilities.handleErrors(accountController.buildUpdateAccount));


/* ======================
 * Authentication & Account Logic
 * ===================== */

// Process login
router.post(
  "/login",
  regValidate.loginRules(),
  regValidate.checkLoginData,
  utilities.handleErrors(accountController.accountLogin)
);

// Process logout
router.get("/logout", utilities.handleErrors(accountController.logout));

// Process new registration
router.post(
  "/register",
  regValidate.registrationRules(),
  regValidate.passwordRules(),
  regValidate.checkRegData,
  utilities.handleErrors(accountController.registerAccount)
);


/* ======================
 * Account Updates (authenticated)
 * ===================== */

// Update personal details
router.post(
  "/update",
  utilities.checkLogin,
  regValidate.updateRules(),
  regValidate.checkUpdateData,
  utilities.handleErrors(accountController.updateAccount)
);

// Update password
router.post(
  "/update-password",
  utilities.checkLogin,
  regValidate.updatePasswordRules(),
  regValidate.checkUpdatePasswordData,
  utilities.handleErrors(accountController.updatePassword)
);

module.exports = router;
