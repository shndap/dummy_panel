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

    return {
      id,
      code: `EXP${String(id).padStart(3, '0')}`,
      date: date.toISOString().split('T')[0],
      improvements,
      status,
      author: authors[Math.floor(Math.random() * authors.length)],
      description: descriptions[Math.floor(Math.random() * descriptions.length)],
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
      }
    };
  });
};

export const experiments = generateExperiments(); 