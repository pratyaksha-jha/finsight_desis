// Using plain pg (node-postgres) — adapt if you use Sequelize/Prisma
const db = require('../config/db');

const UserModel = {
  async create({ name, email, passwordHash, role, budget = null }) {
    const { rows } = await db.query(
      `INSERT INTO users (name, email, password_hash, role, budget)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [name, email, passwordHash, role, budget]
    );
    return rows[0];
  },

  async findByEmail(email) {
    const { rows } = await db.query(
      `SELECT * FROM users WHERE email = $1`, [email]
    );
    return rows[0] || null;
  },

  async findById(id) {
    const { rows } = await db.query(
      `SELECT * FROM users WHERE id = $1`, [id]
    );
    return rows[0] || null;
  },

  async updateBudgetUsed(studentId, amount) {
    const { rows } = await db.query(
      `UPDATE users SET budget_used = budget_used + $1
       WHERE id = $2 RETURNING *`,
      [amount, studentId]
    );
    return rows[0];
  },

  async setBudget(studentId, amount) {
    const { rows } = await db.query(
      `UPDATE users SET budget = $1 WHERE id = $2 RETURNING *`,
      [amount, studentId]
    );
    return rows[0];
  }
};

module.exports = UserModel;