const invModel = require("../models/inventory-model");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const Util = {};

/**
 * @typedef {Object} Message
 * @property {number} message_id
 * @property {string} message_subject
 * @property {string} message_body
 * @property {Date} message_created
 * @property {number} message_to
 * @property {number} message_from
 * @property {boolean} message_read
 * @property {boolean} message_archived
 */

/* *******************************
 * Constructs the nav HTML unordered list
 ********************************/
Util.getNav = async (req, res, next) => {
  const { rows } = await invModel.getClassifications();
  let nav = `<ul>
    <li><a href="/" title="Home page">Home</a></li>`;

  rows.forEach(({ classification_id, classification_name }) => {
    nav += `
      <li>
        <a href="/inv/type/${classification_id}" title="See our inventory of ${classification_name} vehicles">
          ${classification_name}
        </a>
      </li>`;
  });

  nav += "</ul>";
  return nav;
};

/* *************************************
 * Build the classification grid HTML
 **************************************/
Util.buildClassificationGrid = async (vehicles) => {
  if (!vehicles.length) {
    return '<p class="notice">Sorry, no matching vehicles could be found.</p>';
  }

  return `
    <ul id="inv-display">
      ${vehicles
        .map(
          (v) => `
        <li>
          <a href="../../inv/detail/${v.inv_id}" title="View ${v.inv_make} ${v.inv_model} details">
            <img src="${v.inv_thumbnail}" alt="Image of ${v.inv_make} ${v.inv_model} on CSE Motors" />
          </a>
          <div class="namePrice">
            <hr />
            <h2>
              <a href="../../inv/detail/${v.inv_id}">${v.inv_make} ${v.inv_model}</a>
            </h2>
            <span>$${new Intl.NumberFormat("en-US").format(v.inv_price)}</span>
          </div>
        </li>`
        )
        .join("")}
    </ul>`;
};

/**
 * Build a detailed vehicle listing view
 */
Util.buildItemListing = async (data) => {
  if (!data) {
    return `<p>Sorry, no matching vehicles could be found.</p>`;
  }

  return `
    <section class="car-listing">
      <img src="${data.inv_image}" alt="${data.inv_make} ${data.inv_model}">
      <div class="car-information">
        <h2>${data.inv_year} ${data.inv_make} ${data.inv_model}</h2>
        <div>${parseFloat(data.inv_price).toLocaleString("en-US", {
          style: "currency",
          currency: "USD",
        })}</div>
        <div class="description">
          <p>${data.inv_description}</p>
          <dl>
            <dt>MILEAGE</dt><dd>${data.inv_miles.toLocaleString()}</dd>
            <dt>COLOR</dt><dd>${data.inv_color}</dd>
            <dt>CLASS</dt><dd>${data.classification_name}</dd>
          </dl>
        </div>
      </div>
    </section>`;
};

/**
 * Build HTML select dropdown with classification data
 */
Util.buildClassificationList = async (classification_id = null) => {
  const { rows } = await invModel.getClassifications();
  const options = rows
    .map(
      ({ classification_id: id, classification_name }) => `
    <option value="${id}" ${id == classification_id ? "selected" : ""}>
      ${classification_name}
    </option>`
    )
    .join("");

  return `
    <select name="classification_id" id="classificationList" required>
      <option value="">Choose a Classification</option>
      ${options}
    </select>`;
};

/**
 * Wrap async functions for error handling
 */
Util.handleErrors = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

/**
 * Check JWT and load user
 */
Util.checkJWTToken = (req, res, next) => {
  const token = req.cookies.jwt;
  if (!token) return next();

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, accountData) => {
    if (err) {
      req.flash("notice", "Session expired. Please log in.");
      res.clearCookie("jwt");
      return res.redirect("/account/login");
    }

    res.locals.accountData = accountData;
    res.locals.loggedin = true;
    next();
  });
};

/**
 * Set auth token as cookie
 */
Util.updateCookie = (accountData, res) => {
  const token = jwt.sign(accountData, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: "1h",
  });

  const options = {
    httpOnly: true,
    maxAge: 3600000, // 1 hour
    ...(process.env.NODE_ENV !== "development" && { secure: true }),
  };

  res.cookie("jwt", token, options);
};

/**
 * Guard route for logged-in users only
 */
Util.checkLogin = (req, res, next) => {
  if (res.locals.loggedin) return next();

  req.flash("notice", "Please log in.");
  return res.redirect("/account/login");
};

/**
 * Guard route for employees/admins
 */
Util.checkAuthorizationManager = (req, res, next) => {
  const token = req.cookies.jwt;
  if (!token) {
    req.flash("notice", "Unauthorized.");
    return res.redirect("/account/login");
  }

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, accountData) => {
    if (err || !["Employee", "Admin"].includes(accountData.account_type)) {
      req.flash("notice", "You are not authorized to modify inventory.");
      return res.redirect("/account/login");
    }

    next();
  });
};

/**
 * Guard route for Admin-only access
 */
Util.checkAdmin = (req, res, next) => {
  if (res.locals.accountData?.account_type === "Admin") return next();

  req.flash("notice", "Access denied. Admins only.");
  return res.redirect("/account");
};

/**
 * Build Inbox Table
 */
Util.buildInbox = (messages) => {
  const rows = messages
    .map(
      (m) => `
    <tr>
      <td>${m.message_created.toLocaleString()}</td>
      <td><a href="/message/view/${m.message_id}">${m.message_subject}</a></td>
      <td>${m.account_firstname} ${m.account_type}</td>
      <td>${m.message_read ? "✓" : ""}</td>
    </tr>`
    )
    .join("");

  return `
    <table>
      <thead>
        <tr><th>Received</th><th>Subject</th><th>From</th><th>Read</th></tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>`;
};

/**
 * Build select menu of message recipients
 */
Util.buildRecipientList = (recipients, preselected = null) => {
  const options = recipients
    .map(
      (r) => `
      <option value="${r.account_id}" ${
        preselected == r.account_id ? "selected" : ""
      }>
        ${r.account_firstname} ${r.account_lastname}
      </option>`
    )
    .join("");

  return `
    <select name="message_to" required>
      <option value="">Select a recipient</option>
      ${options}
    </select>`;
};

module.exports = Util;
