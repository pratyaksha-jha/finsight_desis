const db = require('../config/db');

const ParentalCommentService = {
  // Add or overwrite the parent's comment on a trade request
  async upsertComment(guardianId, tradeId, comment) {
    // Security: verify this trade belongs to one of the guardian's students
    const { rows: authRows } = await db.query(
      `SELECT tr.id
       FROM trade_requests tr
       JOIN guardian_links gl ON gl.student_id = tr.student_id
       WHERE tr.id = $1 AND gl.guardian_id = $2 AND gl.status = 'active'`,
      [tradeId, guardianId]
    );
    if (!authRows[0]) {
      throw new Error('Trade not found or not under your oversight');
    }

    const { rows } = await db.query(
      `UPDATE trade_requests
       SET parent_comment = $1
       WHERE id = $2
       RETURNING *`,
      [comment, tradeId]
    );
    return rows[0];
  },

  // Get all trades that have a parent comment, for feedback history page
  async getCommentHistory(guardianId) {
    const { rows } = await db.query(
      `SELECT tr.*,
              u.name   AS student_name,
              u.email  AS student_email
       FROM trade_requests tr
       JOIN users u ON u.id = tr.student_id
       JOIN guardian_links gl ON gl.student_id = tr.student_id
       WHERE gl.guardian_id = $1
         AND gl.status = 'active'
         AND tr.parent_comment IS NOT NULL
         AND tr.parent_comment <> ''
       ORDER BY tr.resolved_at DESC NULLS LAST`,
      [guardianId]
    );
    return rows;
  },

  // Get all resolved (non-pending) trades for the feedback history tab
  async getResolvedTrades(guardianId) {
    const { rows } = await db.query(
      `SELECT tr.*,
              u.name  AS student_name,
              u.email AS student_email
       FROM trade_requests tr
       JOIN users u ON u.id = tr.student_id
       JOIN guardian_links gl ON gl.student_id = tr.student_id
       WHERE gl.guardian_id = $1
         AND gl.status = 'active'
         AND tr.status <> 'pending'
       ORDER BY tr.resolved_at DESC`,
      [guardianId]
    );
    return rows;
  },

  // Single trade detail with full comment — used when student views feedback
  async getTradeWithComment(tradeId, studentId) {
    const { rows } = await db.query(
      `SELECT tr.*,
              u.name AS guardian_name
       FROM trade_requests tr
       LEFT JOIN guardian_links gl ON gl.student_id = tr.student_id
       LEFT JOIN users u ON u.id = gl.guardian_id
       WHERE tr.id = $1 AND tr.student_id = $2`,
      [tradeId, studentId]
    );
    if (!rows[0]) throw new Error('Trade not found');
    return rows[0];
  },
};

module.exports = ParentalCommentService;