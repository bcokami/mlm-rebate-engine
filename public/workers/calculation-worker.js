/**
 * Web Worker for heavy calculations
 * 
 * This worker handles CPU-intensive tasks to prevent blocking the main thread.
 * It can be used for complex calculations, data processing, and other operations
 * that might cause UI jank if performed on the main thread.
 */

// Listen for messages from the main thread
self.addEventListener('message', function(e) {
  const { type, data, id } = e.data;
  
  try {
    let result;
    
    switch (type) {
      case 'calculateRebates':
        result = calculateRebates(data);
        break;
        
      case 'processGenealogyData':
        result = processGenealogyData(data);
        break;
        
      case 'calculateCommissions':
        result = calculateCommissions(data);
        break;
        
      case 'generateReportData':
        result = generateReportData(data);
        break;
        
      default:
        throw new Error(`Unknown calculation type: ${type}`);
    }
    
    // Send the result back to the main thread
    self.postMessage({
      id,
      type: `${type}Result`,
      result,
      error: null
    });
  } catch (error) {
    // Send the error back to the main thread
    self.postMessage({
      id,
      type: `${type}Error`,
      result: null,
      error: error.message
    });
  }
});

/**
 * Calculate rebates based on purchase data and rebate rules
 * 
 * @param {Object} data - Purchase and rebate rule data
 * @returns {Object} Calculated rebates
 */
function calculateRebates(data) {
  const { purchases, rebateRules, levels } = data;
  
  // Simulate a heavy calculation
  const startTime = Date.now();
  
  // Process each purchase
  const results = purchases.map(purchase => {
    const { amount, productId, userId } = purchase;
    
    // Find applicable rebate rules for this product
    const rules = rebateRules.filter(rule => rule.productId === productId);
    
    // Calculate rebates for each level
    const rebates = [];
    
    for (const level of levels) {
      const rule = rules.find(r => r.level === level.level);
      
      if (rule) {
        const rebateAmount = amount * (rule.percentage / 100);
        
        rebates.push({
          level: level.level,
          userId: level.userId,
          amount: rebateAmount,
          percentage: rule.percentage
        });
      }
    }
    
    return {
      purchaseId: purchase.id,
      rebates
    };
  });
  
  // Simulate heavy processing
  while (Date.now() - startTime < 500) {
    // Busy wait to simulate heavy calculation
  }
  
  return {
    totalRebates: results.reduce((sum, result) => sum + result.rebates.length, 0),
    totalAmount: results.reduce((sum, result) => {
      return sum + result.rebates.reduce((s, r) => s + r.amount, 0);
    }, 0),
    results
  };
}

/**
 * Process genealogy data to build a tree structure
 * 
 * @param {Object} data - Raw genealogy data
 * @returns {Object} Processed tree structure
 */
function processGenealogyData(data) {
  const { users, rootUserId, maxLevel } = data;
  
  // Simulate a heavy calculation
  const startTime = Date.now();
  
  // Build a map for quick lookup
  const userMap = new Map();
  users.forEach(user => {
    userMap.set(user.id, {
      ...user,
      children: []
    });
  });
  
  // Build the tree
  const rootUser = userMap.get(rootUserId);
  
  if (!rootUser) {
    throw new Error('Root user not found');
  }
  
  // Connect children to parents
  users.forEach(user => {
    if (user.uplineId && user.id !== rootUserId) {
      const parent = userMap.get(user.uplineId);
      if (parent) {
        parent.children.push(userMap.get(user.id));
      }
    }
  });
  
  // Calculate levels and other metrics
  calculateLevels(rootUser, 0, maxLevel);
  
  // Simulate heavy processing
  while (Date.now() - startTime < 800) {
    // Busy wait to simulate heavy calculation
  }
  
  return rootUser;
}

/**
 * Helper function to calculate levels in the genealogy tree
 * 
 * @param {Object} node - Current node
 * @param {number} level - Current level
 * @param {number} maxLevel - Maximum level to process
 */
function calculateLevels(node, level, maxLevel) {
  node.level = level;
  
  if (level < maxLevel && node.children) {
    node.children.forEach(child => {
      calculateLevels(child, level + 1, maxLevel);
    });
  }
}

/**
 * Calculate commissions based on sales data and commission rules
 * 
 * @param {Object} data - Sales and commission rule data
 * @returns {Object} Calculated commissions
 */
function calculateCommissions(data) {
  const { sales, commissionRules, users } = data;
  
  // Simulate a heavy calculation
  const startTime = Date.now();
  
  // Calculate commissions for each user
  const results = users.map(user => {
    const userSales = sales.filter(sale => sale.userId === user.id);
    const totalSales = userSales.reduce((sum, sale) => sum + sale.amount, 0);
    
    // Find applicable commission rule
    const rule = commissionRules.find(r => 
      totalSales >= r.minSales && totalSales <= (r.maxSales || Infinity)
    );
    
    const commissionRate = rule ? rule.rate : 0;
    const commissionAmount = totalSales * commissionRate;
    
    return {
      userId: user.id,
      userName: user.name,
      totalSales,
      commissionRate,
      commissionAmount
    };
  });
  
  // Simulate heavy processing
  while (Date.now() - startTime < 600) {
    // Busy wait to simulate heavy calculation
  }
  
  return {
    totalCommissions: results.reduce((sum, r) => sum + r.commissionAmount, 0),
    results
  };
}

/**
 * Generate report data with various metrics and statistics
 * 
 * @param {Object} data - Raw data for report generation
 * @returns {Object} Processed report data
 */
function generateReportData(data) {
  const { sales, users, products, dateRange } = data;
  
  // Simulate a heavy calculation
  const startTime = Date.now();
  
  // Calculate sales by product
  const salesByProduct = products.map(product => {
    const productSales = sales.filter(sale => sale.productId === product.id);
    const totalAmount = productSales.reduce((sum, sale) => sum + sale.amount, 0);
    const totalQuantity = productSales.reduce((sum, sale) => sum + sale.quantity, 0);
    
    return {
      productId: product.id,
      productName: product.name,
      totalAmount,
      totalQuantity,
      averagePrice: totalQuantity > 0 ? totalAmount / totalQuantity : 0
    };
  });
  
  // Calculate sales by user
  const salesByUser = users.map(user => {
    const userSales = sales.filter(sale => sale.userId === user.id);
    const totalAmount = userSales.reduce((sum, sale) => sum + sale.amount, 0);
    
    return {
      userId: user.id,
      userName: user.name,
      totalAmount,
      salesCount: userSales.length
    };
  });
  
  // Calculate sales by date
  const salesByDate = {};
  sales.forEach(sale => {
    const date = new Date(sale.date).toISOString().split('T')[0];
    
    if (!salesByDate[date]) {
      salesByDate[date] = {
        date,
        totalAmount: 0,
        salesCount: 0
      };
    }
    
    salesByDate[date].totalAmount += sale.amount;
    salesByDate[date].salesCount += 1;
  });
  
  // Simulate heavy processing
  while (Date.now() - startTime < 1000) {
    // Busy wait to simulate heavy calculation
  }
  
  return {
    salesByProduct,
    salesByUser,
    salesByDate: Object.values(salesByDate),
    totalSales: sales.reduce((sum, sale) => sum + sale.amount, 0),
    totalQuantity: sales.reduce((sum, sale) => sum + sale.quantity, 0),
    averageOrderValue: sales.length > 0 ? 
      sales.reduce((sum, sale) => sum + sale.amount, 0) / sales.length : 0
  };
}
