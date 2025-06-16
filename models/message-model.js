const pool = require("../database/");

/**
 * Get all messages sent *to* an account
 */
async function getMessagesToId(accountId, archived = false) {
  const sql = `
    SELECT 
      message_id, message_subject, message_body, message_created, 
      message_to, message_from, message_read, message_archived, 
      account_firstname, account_lastname, account_type
    FROM public.message
    JOIN public.account ON message.message_from = account.account_id
    WHERE message_to = $1 AND message_archived = $2
    ORDER BY message_created DESC;
  `;

  try {
    const result = await pool.query(sql, [accountId, archived]);
    return result.rows;
  } catch (err) {
    console.error("Error getting messages:", err);
    return [];
  }
}

/**
 * Get a specific message by ID
 */
async function getMessageById(messageId) {
  const sql = `
    SELECT 
      message_id, message_subject, message_body, message_created, 
      message_to, message_from, message_read, message_archived, 
      account_id, account_firstname, account_lastname, account_type
    FROM public.message
    JOIN public.account ON message.message_from = account.account_id
    WHERE message_id = $1;
  `;

  try {
    const result = await pool.query(sql, [messageId]);
    return result.rows[0];
  } catch (err) {
    console.error("Error getting message by ID:", err);
    return null;
  }
}

/**
 * Send a message
 */
async function sendMessage({ message_subject, message_body, message_to, message_from }) {
  const sql = `
    INSERT INTO public.message (message_subject, message_body, message_to, message_from)
    VALUES ($1, $2, $3, $4);
  `;

  try {
    return await pool.query(sql, [message_subject, message_body, message_to, message_from]);
  } catch (err) {
    console.error("Error sending message:", err);
    return null;
  }
}

/**
 * Count all messages sent *to* an account (optionally archived)
 */
async function getMessageCountById(accountId, archived = false) {
  const sql = `
    SELECT COUNT(*) 
    FROM public.message
    WHERE message_to = $1 AND message_archived = $2;
  `;

  try {
    const result = await pool.query(sql, [accountId, archived]);
    return parseInt(result.rows[0].count);
  } catch (err) {
    console.error("Error counting messages:", err);
    return 0;
  }
}

/**
 * Count unread messages (not archived)
 */
async function countUnreadMessages(accountId) {
  const sql = `
    SELECT COUNT(*) 
    FROM public.message
    WHERE message_to = $1 AND message_read = false AND message_archived = false;
  `;

  try {
    const result = await pool.query(sql, [accountId]);
    return parseInt(result.rows[0].count);
  } catch (err) {
    console.error("Error counting unread messages:", err);
    return 0;
  }
}

/**
 * Toggle read/unread status of a message
 */
async function toggleRead(messageId) {
  const sql = `
    UPDATE public.message
    SET message_read = NOT message_read
    WHERE message_id = $1
    RETURNING message_read;
  `;

  try {
    const result = await pool.query(sql, [messageId]);
    return result.rows[0].message_read;
  } catch (err) {
    console.error("Error toggling read status:", err);
    return null;
  }
}

/**
 * Toggle archive/unarchive status of a message
 */
async function toggleArchived(messageId) {
  const sql = `
    UPDATE public.message
    SET message_archived = NOT message_archived
    WHERE message_id = $1
    RETURNING message_archived;
  `;

  try {
    const result = await pool.query(sql, [messageId]);
    return result.rows[0].message_archived;
  } catch (err) {
    console.error("Error toggling archived status:", err);
    return null;
  }
}

/**
 * Delete a message by ID
 */
async function deleteMessage(messageId) {
  const sql = `
    DELETE FROM public.message
    WHERE message_id = $1;
  `;

  try {
    return await pool.query(sql, [messageId]);
  } catch (err) {
    console.error(`Error deleting message ${messageId}:`, err);
    return null;
  }
}

module.exports = {
  getMessagesToId,
  getMessageById,
  sendMessage,
  getMessageCountById,
  countUnreadMessages,
  toggleRead,
  toggleArchived,
  deleteMessage,
};
