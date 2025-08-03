// Generate 50 random experiments
const generateExperiments = () => {
  return [...Array(50)].map((_, index) => {
    const id = index + 1;
    const date = new Date();
    date.setDate(date.getDate() - Math.floor(Math.random() * 30));
    
    const baseOpenBuy = 200 + Math.floor(Math.random() * 20 - 10);
    const baseOpenSell = baseOpenBuy - Math.floor(Math.random() * 10 + 5);
    const baseCloseBuy = 150 + Math.floor(Math.random() * 20 - 10);
    const baseCloseSell = baseCloseBuy - Math.floor(Math.random() * 10 + 2);
    const baseMSE = 0.018 + (Math.random() * 0.004 - 0.002);
    const baseHighLow = 0.80 + Math.random() * 0.15;

    const statuses = ['valid', 'valid', 'valid', 'valid', 'invalid'];
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    
    const possibleImprovements = ['Open', 'Close', 'Reg'];
    const improvements = status === 'invalid' ? [] : 
      Math.random() < 0.2 ? [] : 
      [...possibleImprovements].sort(() => Math.random() - 0.5).slice(0, Math.floor(Math.random() * 3) + 1);

    const authors = [
      'John Doe', 'Jane Smith', 'Mike Johnson', 'Sarah Wilson',
      'Alex Chen', 'Maria Garcia', 'Tom Brown', 'Lisa Anderson'
    ];

    const descriptions = [
      'Optimized algorithm parameters',
      'Enhanced feature selection',
      'Improved data preprocessing',
      'Modified neural network architecture',
      'Adjusted hyperparameters',
      'Implemented new trading logic',
      'Updated risk management',
      'Fine-tuned model weights',
      'Added market regime detection',
      'Optimized execution timing'
    ];

    if (status === 'invalid') {
      descriptions.push(
        'Failed due to memory leak',
        'Invalid results - data corruption',
        'Runtime error in optimization',
        'Inconsistent performance metrics',
        'Failed validation checks'
      );
    }

    // Generate tags
    const allTags = [
      'high-frequency', 'low-latency', 'machine-learning', 'deep-learning',
      'neural-network', 'optimization', 'risk-management', 'backtesting',
      'live-trading', 'paper-trading', 'alpha-generation', 'beta-neutral',
      'momentum', 'mean-reversion', 'arbitrage', 'statistical-arbitrage',
      'market-making', 'trend-following', 'contrarian', 'scalping',
      'swing-trading', 'position-trading', 'quantitative', 'fundamental',
      'technical-analysis', 'sentiment-analysis', 'news-trading', 'event-driven'
    ];
    
    const numTags = Math.floor(Math.random() * 4) + 1; // 1-4 tags per experiment
    const tags = [...allTags]
      .sort(() => Math.random() - 0.5)
      .slice(0, numTags);

    // Generate comprehensive financial metrics
    const basePnL = (Math.random() - 0.5) * 10000; // -5000 to 5000
    const profit = Math.max(0, basePnL);
    const loss = Math.max(0, -basePnL);
    const totalTrades = Math.floor(Math.random() * 1000) + 50;
    const winRate = 0.3 + Math.random() * 0.5; // 30% to 80%
    const avgWin = Math.random() * 200 + 50;
    const avgLoss = Math.random() * 150 + 30;
    const sharpeRatio = (Math.random() - 0.5) * 4; // -2 to 2
    const maxDrawdown = Math.random() * 0.3; // 0% to 30%
    const volatility = Math.random() * 0.4 + 0.1; // 10% to 50%

    // Generate quarterly PnL data
    const pnlQ1 = (Math.random() - 0.5) * 3000;
    const pnlQ2 = (Math.random() - 0.5) * 3000;
    const pnlQ3 = (Math.random() - 0.5) * 3000;
    const pnlQ4 = (Math.random() - 0.5) * 3000;

    // Generate ML metrics
    const precision = 0.4 + Math.random() * 0.5; // 40% to 90%
    const recall = 0.3 + Math.random() * 0.6; // 30% to 90%
    const f1Score = 2 * (precision * recall) / (precision + recall);
    const accuracy = 0.5 + Math.random() * 0.4; // 50% to 90%

    // Generate validation metrics
    const validationPrecision = precision + (Math.random() - 0.5) * 0.2;
    const validationRecall = recall + (Math.random() - 0.5) * 0.2;
    const validationF1 = 2 * (validationPrecision * validationRecall) / (validationPrecision + validationRecall);
    const validationAccuracy = accuracy + (Math.random() - 0.5) * 0.15;

    // Generate additional performance metrics
    const profitFactor = Math.random() * 3 + 0.5; // 0.5 to 3.5
    const calmarRatio = Math.random() * 2 - 1; // -1 to 1
    const sortinoRatio = (Math.random() - 0.5) * 3; // -1.5 to 1.5
    const maxConsecutiveLosses = Math.floor(Math.random() * 10) + 1;
    const avgTradeDuration = Math.floor(Math.random() * 24) + 1; // 1-24 hours

    return {
      id,
      code: `EXP${String(id).padStart(3, '0')}`,
      date: date.toISOString().split('T')[0],
      improvements,
      status,
      author: authors[Math.floor(Math.random() * authors.length)],
      description: descriptions[Math.floor(Math.random() * descriptions.length)],
      tags,
      metrics: {
        open: {
          buy: baseOpenBuy,
          sell: baseOpenSell,
        },
        close: {
          buy: baseCloseBuy,
          sell: baseCloseSell,
        },
        reg: {
          mse: baseMSE,
          highlowBuy: baseHighLow,
          highlowSell: baseHighLow - Math.random() * 0.05,
        }
      },
      financial: {
        pnl: basePnL,
        profit,
        loss,
        totalTrades,
        winRate,
        avgWin,
        avgLoss,
        sharpeRatio,
        maxDrawdown,
        volatility,
        // Quarterly PnL
        pnlQ1,
        pnlQ2,
        pnlQ3,
        pnlQ4,
        // Additional financial metrics
        profitFactor,
        calmarRatio,
        sortinoRatio,
        maxConsecutiveLosses,
        avgTradeDuration
      },
      mlMetrics: {
        precision,
        recall,
        f1Score,
        accuracy,
        validationPrecision,
        validationRecall,
        validationF1,
        validationAccuracy
      }
    };
  });
};

export const experiments = generateExperiments();