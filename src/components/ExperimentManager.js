import React, { useRef, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { experiments } from '../data/experiments';

ChartJS.register(
  CategoryScale,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend
);

const Card = ({ title, value, color }) => (
  <div 
    style={{ 
      flex: 1, 
      margin: '10px', 
      padding: '20px', 
      background: 'white',
      borderRadius: '8px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      textAlign: 'center',
      border: `1px solid ${color}`,
    }}
  >
    <h3 style={{ color: color, marginTop: 0 }}>{title}</h3>
    <p style={{ 
      fontSize: '24px', 
      fontWeight: 'bold',
      color: color,
      margin: '10px 0' 
    }}>
      {value}
    </p>
  </div>
);

const ExperimentManager = () => {
  const chartRef = useRef(null);

  // Cleanup chart on unmount
  useEffect(() => {
    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
      }
    };
  }, []);

  // Baseline values for the tests
  const baselineData = {
    open: 200,
    close: 150,
    reg: 180,
  };

  // Dummy data for the chart (mean values over time)
  const chartLabels = ['Day 1', 'Day 2', 'Day 3', 'Day 4', 'Day 5'];
  const data = {
    labels: chartLabels,
    datasets: [
      {
        label: 'Open',
        data: [200, 205, 210, 208, 207],
        borderColor: 'rgba(75,192,192,1)',
        backgroundColor: 'rgba(75,192,192,0.2)',
        fill: true,
        tension: 0.4
      },
      {
        label: 'Close',
        data: [150, 152, 149, 151, 150],
        borderColor: 'rgba(255,99,132,1)',
        backgroundColor: 'rgba(255,99,132,0.2)',
        fill: true,
        tension: 0.4
      },
      {
        label: 'Reg',
        data: [180, 182, 181, 183, 185],
        borderColor: 'rgba(54,162,235,1)',
        backgroundColor: 'rgba(54,162,235,0.2)',
        fill: true,
        tension: 0.4
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Mean Values Over Time',
        font: {
          size: 16
        }
      }
    },
    scales: {
      y: {
        beginAtZero: false,
        grid: {
          color: 'rgba(0,0,0,0.05)'
        }
      },
      x: {
        grid: {
          color: 'rgba(0,0,0,0.05)'
        }
      }
    }
  };

  return (
    <div style={{ 
      padding: '20px',
      maxWidth: '1200px',
      margin: '0 auto',
      backgroundColor: '#f5f5f5',
      minHeight: '100vh'
    }}>
      <h2 style={{ 
        color: '#333',
        borderBottom: '2px solid #eee',
        paddingBottom: '10px',
        marginBottom: '20px'
      }}>
        Experiment Manager (Improvements)
      </h2>

      {/* Baseline Cards */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        marginBottom: '20px'
      }}>
        <Card title="Open" value={baselineData.open} color="rgb(75,192,192)" />
        <Card title="Close" value={baselineData.close} color="rgb(255,99,132)" />
        <Card title="Reg" value={baselineData.reg} color="rgb(54,162,235)" />
      </div>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: '1fr 2fr',
        gap: '20px',
        marginBottom: '20px' 
      }}>
        {/* Improvements List */}
        <div style={{ 
          background: 'white',
          padding: '20px',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ 
            color: '#333',
            marginTop: 0,
            marginBottom: '15px'
          }}>
            Improved Experiments
          </h3>
          <div style={{ 
            maxHeight: '400px',
            overflowY: 'auto'
          }}>
            {experiments
              .filter(exp => exp.status === 'valid' && exp.improvements.length > 0)
              .map(exp => (
                <div 
                  key={exp.id}
                  style={{
                    padding: '10px',
                    marginBottom: '10px',
                    borderLeft: '4px solid',
                    borderLeftColor: 
                      exp.improvements.includes('Open') ? 'rgb(75,192,192)' :
                      exp.improvements.includes('Close') ? 'rgb(255,99,132)' :
                      'rgb(54,162,235)',
                    backgroundColor: '#f8f9fa',
                    borderRadius: '0 4px 4px 0'
                  }}
                >
                  <div style={{ fontWeight: 'bold' }}>{exp.code}</div>
                  <div style={{ 
                    fontSize: '0.9em',
                    color: '#666',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px'
                  }}>
                    <div>Improvements: {exp.improvements.join(', ')}</div>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      color: '#888',
                      fontSize: '0.85em'
                    }}>
                      <span>{exp.author}</span>
                      <span>{new Date(exp.date).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Chart */}
        <div style={{ 
          background: 'white',
          padding: '20px',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          height: '400px'
        }}>
          <Line
            ref={chartRef}
            data={data}
            options={options}
          />
        </div>
      </div>
    </div>
  );
};

export default ExperimentManager;