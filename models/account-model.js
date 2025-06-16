const pool = require("../database/");

/* *****************************
 * Register new account
 * *************************** */
async function registerAccount(firstname, lastname, email, password) {
  try {
    const sql = `
      INSERT INTO account (account_firstname, account_lastname, account_email, account_password, account_type)
      VALUES ($1, $2, $3, $4, 'Client')
      RETURNING account_id, account_firstname, account_lastname, account_email, account_type
    `;
    const result = await pool.query(sql, [firstname, lastname, email, password]);
    return result.rows[0];
  } catch (error) {
    console.error("registerAccount error:", error);
    throw new Error("Registration failed");
  }
}

/* *****************************
 * Check for existing email (optionally exclude current email)
 * *************************** */
async function checkExistingEmail(email, excludedEmail = null) {
  try {
    let sql, values;
    if (excludedEmail) {
      sql = "SELECT 1 FROM account WHERE account_email = $1 AND account_email != $2";
      values = [email, excludedEmail];
    } else {
      sql = "SELECT 1 FROM account WHERE account_email = $1";
      values = [email];
    }
    const result = await pool.query(sql, values);
    return result.rowCount > 0;
  } catch (error) {
    console.error("checkExistingEmail error:", error);
    throw new Error("Email verification failed");
  }
}

/* *****************************
 * Get account by email
 * *************************** */
async function getAccountByEmail(email) {
  try {
    const sql = `
      SELECT account_id, account_firstname, account_lastname, account_email, account_type, account_password
      FROM account
      WHERE account_email = $1
    `;
    const result = await pool.query(sql, [email]);
    return result.rows[0] || null;
  } catch (error) {
    console.error("getAccountByEmail error:", error);
    throw new Error("Could not retrieve account by email");
  }
}

/* *****************************
 * Get account by ID
 * *************************** */
async function getAccountById(id) {
  try {
    const sql = `
      SELECT account_id, account_firstname, account_lastname, account_email, account_type, account_password
      FROM account
      WHERE account_id = $1
    `;
    const result = await pool.query(sql, [id]);
    return result.rows[0] || null;
  } catch (error) {
    console.error("getAccountById error:", error);
    throw new Error("Could not retrieve account by ID");
  }
}

/* *****************************
 * Update account details (not password)
 * *************************** */
async function updateAccount(id, firstname, lastname, email) {
  try {
    const sql = `
      UPDATE account
      SET account_firstname = $1, account_lastname = $2, account_email = $3
      WHERE account_id = $4
      RETURNING account_id, account_firstname, account_lastname, account_email
    `;
    const result = await pool.query(sql, [firstname, lastname, email, id]);
    return result.rows[0];
  } catch (error) {
    console.error("updateAccount error:", error);
    throw new Error("Account update failed");
  }
}

/* *****************************
 * Update account password
 * *************************** */
async function updatePassword(id, hashedPassword) {
  try {
    const sql = `
      UPDATE account
      SET account_password = $1
      WHERE account_id = $2
      RETURNING account_id
    `;
    const result = await pool.query(sql, [hashedPassword, id]);
    return result.rowCount > 0;
  } catch (error) {
    console.error("updatePassword error:", error);
    throw new Error("Password update failed");
  }
}

/* *****************************
 * Get all accounts (for admin)
 * *************************** */
async function getAccountList() {
  try {
    const sql = `
      SELECT account_id, account_firstname, account_lastname
      FROM account
      ORDER BY account_lastname ASC
    `;
    const result = await pool.query(sql);
    return result.rows;
  } catch (error) {
    console.error("getAccountList error:", error);
    throw new Error("Could not retrieve account list");
  }
}

module.exports = {
  registerAccount,
  checkExistingEmail,
  getAccountByEmail,
  getAccountById,
  updateAccount,
  updatePassword,
  getAccountList,
};
