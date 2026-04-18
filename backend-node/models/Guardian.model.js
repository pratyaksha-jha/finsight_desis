const db = require('../config/db');
const crypto = require('crypto');

const GuardianModel = {
  async createLink(studentId) {
    const token = crypto.randomBytes(32).toString('hex');
    const { rows } = await db.query(
      `INSERT INTO guardian_links (student_id, invite_token)
       VALUES ($1, $2) RETURNING *`,
      [studentId, token]
    );
    return rows[0]; // return token so it can be emailed
  },

  async activateLink(token, guardianId) {
    const { rows } = await db.query(
      `UPDATE guardian_links
       SET guardian_id = $1, status = 'active', linked_at = NOW()
       WHERE invite_token = $2 AND status = 'pending'
       RETURNING *`,
      [guardianId, token]
    );
    return rows[0] || null;
  },

  async getLink(studentId) {
    const { rows } = await db.query(
      `SELECT gl.*, u.name AS guardian_name, u.email AS guardian_email
       FROM guardian_links gl
       JOIN users u ON u.id = gl.guardian_id
       WHERE gl.student_id = $1 AND gl.status = 'active'`,
      [studentId]
    );
    return rows[0] || null;
  },

  async getStudentsForGuardian(guardianId) {
    const { rows } = await db.query(
      `SELECT u.* FROM users u
       JOIN guardian_links gl ON gl.student_id = u.id
       WHERE gl.guardian_id = $1 AND gl.status = 'active'`,
      [guardianId]
    );
    return rows;
  },

  // Trade request methods
  async createTradeRequest({ studentId, symbol, qty, action, estimatedPrice, reasoning, status = 'pending' }) {
    const { rows } = await db.query(
      `INSERT INTO trade_requests
         (student_id, symbol, qty, action, estimated_price, reasoning, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [studentId, symbol, qty, action, estimatedPrice, reasoning, status]
    );
    return rows[0];
  },
  

  async getTradesByStudent(studentId) {
    const { rows } = await db.query(
      `SELECT * FROM trade_requests WHERE student_id = $1
       ORDER BY created_at DESC`,
      [studentId]
    );
    return rows;
  },

  async getPendingForGuardian(guardianId) {
    const { rows } = await db.query(
      `SELECT tr.*, u.name AS student_name
       FROM trade_requests tr
       JOIN users u ON u.id = tr.student_id
       JOIN guardian_links gl ON gl.student_id = tr.student_id
       WHERE gl.guardian_id = $1 AND tr.status = 'pending'
       ORDER BY tr.created_at DESC`,
      [guardianId]
    );
    return rows;
  },

  async resolveTradeRequest(tradeId, status, parentComment) {
    const { rows } = await db.query(
      `UPDATE trade_requests
       SET status = $1, parent_comment = $2, resolved_at = NOW()
       WHERE id = $3 RETURNING *`,
      [status, parentComment, tradeId]
    );
    return rows[0] || null;
  }
};

module.exports = GuardianModel;