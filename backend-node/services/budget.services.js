const db = require('../config/db');

const BudgetService = {
  // Get full budget details for a student
  async getForStudent(studentId) {
    const { rows } = await db.query(
      `SELECT id, name, email, budget, budget_used,
              (budget - budget_used) AS budget_remaining
       FROM users
       WHERE id = $1 AND role = 'student'`,
      [studentId]
    );
    if (!rows[0]) throw new Error('Student not found');
    return rows[0];
  },

  // Parent sets a new total budget for their student
  async allocate(guardianId, studentId, amount) {
    if (amount <= 0) throw new Error('Budget must be a positive number');

    // Security: confirm this guardian is actually linked to this student
    const { rows: linkRows } = await db.query(
      `SELECT id FROM guardian_links
       WHERE guardian_id = $1 AND student_id = $2 AND status = 'active'`,
      [guardianId, studentId]
    );
    if (!linkRows[0]) {
      throw new Error('You are not linked to this student');
    }

    const { rows } = await db.query(
      `UPDATE users SET budget = $1 WHERE id = $2 RETURNING
         id, name, email, budget, budget_used,
         (budget - budget_used) AS budget_remaining`,
      [amount, studentId]
    );
    return rows[0];
  },

  // Called internally when a trade is approved — deducts from budget
  async deduct(studentId, amount) {
    const student = await this.getForStudent(studentId);
    const remaining = (student.budget ?? 0) - (student.budget_used ?? 0);

    if (amount > remaining) {
      throw new Error(
        `Trade cost $${amount.toFixed(2)} exceeds remaining budget $${remaining.toFixed(2)}`
      );
    }

    const { rows } = await db.query(
      `UPDATE users
       SET budget_used = budget_used + $1
       WHERE id = $2
       RETURNING id, budget, budget_used, (budget - budget_used) AS budget_remaining`,
      [amount, studentId]
    );
    return rows[0];
  },

  // Called if an approved trade is later reversed (sell / cancellation)
  async refund(studentId, amount) {
    const { rows } = await db.query(
      `UPDATE users
       SET budget_used = GREATEST(budget_used - $1, 0)
       WHERE id = $2
       RETURNING id, budget, budget_used, (budget - budget_used) AS budget_remaining`,
      [amount, studentId]
    );
    return rows[0];
  },

  // Guard — used by middleware before any student trade is submitted
  async checkSufficiency(studentId, requiredAmount) {
    const { rows } = await db.query(
      `SELECT (budget - budget_used) AS remaining FROM users WHERE id = $1`,
      [studentId]
    );
    const remaining = parseFloat(rows[0]?.remaining ?? 0);
    if (requiredAmount > remaining) {
      throw new Error(
        `Insufficient budget. You need $${requiredAmount.toFixed(2)} but only $${remaining.toFixed(2)} is available.`
      );
    }
    return true;
  },
};

module.exports = BudgetService;