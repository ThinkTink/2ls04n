const e = require('express');
const express = require('express');
const { Transaction } = require('../db/models');

const router = express.Router();

/**
 * Get transactions grouped by date, month, or year between two intervals
 * Sample query: /api/transactions/spikes?period=6
 */
router.get('/spikes', async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Please log in' });
    }

    let { period } = req.query;
    
    // Spending X month ago where X by default is 1 year ago
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - period);

    // Spending 1 month ago
    const pastMonth = new Date();
    pastMonth.setMonth(pastMonth.getMonth() - 1);

    const pastTransactions = await Transaction.getTransactionsForRange(
      user_id,
      startDate,
      endDate
    );
    const currentTransactions = await Transaction.getTransactionsForRange(
      user_id,
      pastMonth,
      endDate
    );

    const averageForPastTransactions = {};
    for (const transaction of pastTransactions) {
      const categoryList = transaction.categories.split(',');
      const mainCategory = categoryList?.[0];
      if (mainCategory in averageForPastTransactions) {
        averageForPastTransactions[mainCategory] += transaction.amount;
      } else {
        averageForPastTransactions[mainCategory] = transaction.amount;
      }
    }

    for (const category in averageForPastTransactions) {
      const totalAmount = averageForPastTransactions[category];
      const average = Math.round(totalAmount / period);
      averageForPastTransactions[category] = average;
    }
    
    const averageForCurrentTransactions = {};
    for (const transaction of currentTransactions) {
      const categoryList = transaction.categories.split(',');
      const mainCategory = categoryList?.[0];
      if (mainCategory in averageForCurrentTransactions) {
        averageForCurrentTransactions[mainCategory] += transaction.amount;
      } else {
        averageForCurrentTransactions[mainCategory] = transaction.amount;
      }
    }

    for (const category in averageForCurrentTransactions) {
      const totalAmount = averageForCurrentTransactions[category];
      const average = Math.round(totalAmount / period);
      averageForCurrentTransactions[category] = average;
    }

    const spikes = {};

    for (const category in averageForPastTransactions) {
      if (
        category in averageForPastTransactions &&
        averageForPastTransactions[category] >
          averageForCurrentTransactions[category]
      ) {
        spikes[category] = {
          currentSpending: averageForCurrentTransactions[category],
          pastSpending: averageForPastTransactions[category],
        };
      }
    }

    res.json({ spikes });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
