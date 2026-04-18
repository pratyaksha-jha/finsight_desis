const GuardianModel = require('../models/Guardian.model');
const UserModel = require('../models/User.model');
const db = require('../config/db');

async function updateHoldings(userId, symbol, qty, action, price) {
  try {
    const { rows } = await db.query('SELECT * FROM holdings WHERE user_id = $1 AND ticker = $2', [userId, symbol]);
    const holding = rows[0];

    // Force strict numbers to prevent JavaScript string concatenation bugs
    const numQty = Number(qty);
    const numPrice = Number(price);

    if (action === 'buy') {
      if (holding) {
        const oldQty = Number(holding.quantity);
        const oldAvg = Number(holding.avg_buy_price);
        
        const newQty = oldQty + numQty;
        const newAvg = ((oldQty * oldAvg) + (numQty * numPrice)) / newQty;
        
        await db.query(
          'UPDATE holdings SET quantity = $1, avg_buy_price = $2, current_price = $3 WHERE id = $4',
          [newQty, newAvg, numPrice, holding.id]
        );
        console.log(`✅ [TRADE SUCCESS] Averaged up/down ${symbol} for user ${userId.substring(0,6)}...`);
      } else {
        const { rows: compRows } = await db.query('SELECT sector FROM companies WHERE ticker = $1', [symbol]);
        const sector = compRows[0]?.sector || 'Unknown';
        
        await db.query(
          'INSERT INTO holdings (user_id, ticker, sector, quantity, avg_buy_price, current_price) VALUES ($1, $2, $3, $4, $5, $6)',
          [userId, symbol, sector, numQty, numPrice, numPrice]
        );
        console.log(`✅ [TRADE SUCCESS] Added new stock ${symbol} for user ${userId.substring(0,6)}...`);
      }
    } else if (action === 'sell' && holding) {
      const oldQty = Number(holding.quantity);
      const newQty = oldQty - numQty;
      
      if (newQty > 0) {
        await db.query('UPDATE holdings SET quantity = $1, current_price = $2 WHERE id = $3', [newQty, numPrice, holding.id]);
        console.log(`✅ [TRADE SUCCESS] Sold partial shares of ${symbol}.`);
      } else {
        await db.query('DELETE FROM holdings WHERE id = $1', [holding.id]); 
        console.log(`✅ [TRADE SUCCESS] Sold ALL shares of ${symbol}. Removed from holdings.`);
      }
    }
  } catch (err) {
    console.error("❌ [TRADE ERROR] Database failed to update holdings:", err);
  }
}

const GuardianLinkService = {
  // Student calls this after registering
  async sendInvite(studentId) {
    const link = await GuardianModel.createLink(studentId);
    // In production: send link.invite_token via email to parentEmail
    // For now: return token so it can be tested
    return link.invite_token;
  },

  // Parent clicks link in email, confirms linkage
  async acceptInvite(token, guardianId) {
    const link = await GuardianModel.activateLink(token, guardianId);
    if (!link) throw new Error('Invalid or expired invite token');
    return link;
  },

  async getMyStudents(guardianId) {
    return GuardianModel.getStudentsForGuardian(guardianId);
  },

  async allocateBudget(guardianId, studentId, amount) {
    // Verify guardian actually owns this student
    const students = await GuardianModel.getStudentsForGuardian(guardianId);
    const isLinked = students.some(s => s.id === studentId);
    if (!isLinked) throw new Error('Student not linked to this guardian');

    return UserModel.setBudget(studentId, amount);
  },

  // Student submits trade — checks budget first
  async submitTradeRequest(student, tradeData) {
    const { symbol, qty, action, estimatedPrice, reasoning } = tradeData;
    const totalCost = qty * estimatedPrice;

    const isAdult = student.role === 'adult';

    if (!isAdult) {
      if (action === 'buy') {
        if (student.budget === null || student.budget === undefined) {
          throw new Error('No budget allocated yet. Ask your guardian to set a budget before trading.');
        }
        const remaining = student.budget - (student.budget_used || 0);
        if (totalCost > remaining) {
          throw new Error(`Insufficient budget. Available: $${remaining.toFixed(2)}`);
        }
      }

      // Check student has an active guardian link
      const link = await GuardianModel.getLink(student.id);
      if (!link) throw new Error('No active guardian linked. Ask your parent to accept your invite.');
    }
const trade = await GuardianModel.createTradeRequest({
      studentId: student.id, symbol, qty, action, estimatedPrice, reasoning,
      status: isAdult ? 'approved' : 'pending',
    });

    if (isAdult) {
      await updateHoldings(student.id, symbol, qty, action, estimatedPrice);
    }

    return trade;
  },

  async approveTrade(guardianId, tradeId, parentComment) {
    // Verify trade belongs to this guardian's student
    const pending = await GuardianModel.getPendingForGuardian(guardianId);
    const trade = pending.find(t => t.id === tradeId);
    if (!trade) throw new Error('Trade not found or not under your oversight');

    const resolved = await GuardianModel.resolveTradeRequest(tradeId, 'approved', parentComment);

    // 1. FIXED: Only deduct from student budget if they are BUYING
    if (trade.action === 'buy') {
      await UserModel.updateBudgetUsed(
        trade.student_id,
        trade.qty * trade.estimated_price
      );
    }

    // 2. NEW: Actually update the student's portfolio!
    await updateHoldings(trade.student_id, trade.symbol, trade.qty, trade.action, trade.estimated_price);

    return resolved;
  },

  async rejectTrade(guardianId, tradeId, parentComment) {
    const pending = await GuardianModel.getPendingForGuardian(guardianId);
    const trade = pending.find(t => t.id === tradeId);
    if (!trade) throw new Error('Trade not found or not under your oversight');

    return GuardianModel.resolveTradeRequest(tradeId, 'rejected', parentComment);
  }
};

module.exports = GuardianLinkService;