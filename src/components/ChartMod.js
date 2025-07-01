// ChartDisplay.jsx
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  TimeScale,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import 'chartjs-adapter-date-fns';

import React from 'react';

ChartJS.register(
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  TimeScale,
  Title,
  Tooltip,
  Legend
);

const ChartMod = ({
  title = 'Chart',
  dataPoints = [],
  unit = '°C',
  extraLines = [],
  labels = [],
  isTimeAxis = false 
}) => {
  const chartData = {
    datasets: [
      {
        label: title,
        data: dataPoints,
        borderColor: '#34B61F',
        backgroundColor: '#B0E000',
        tension: 0.3,
        pointRadius: 4
      },
      ...extraLines.map(line => ({
        label: line.label,
        data: dataPoints.map(point => ({ x: point.x, y: Number(line.value) })),
        borderColor: line.color || 'red',
        backgroundColor: '#FF8282',
        borderWidth: 2,
        pointRadius: 0,
        tension: 0
      }))
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          font: {
            size: 12,
            family: 'RobotoCondensed'
          }
        }
      },
      title: {
        display: true,
        text: title,
        font: {
          size: 16,
          family: 'RobotoCondensed'
        }
      }, 
    },
    scales: {
      x: isTimeAxis
      ? {
          type: 'time',
          time: {
            unit: 'minute',
            tooltipFormat: 'HH:mm'
          },
          ticks: {
            autoSkip: true
          }
        }
      : {
          ticks: {
            autoSkip: true,
            maxTicksLimit: 20
          }
        },
      y: {
        title: {
          display: true,
          text: unit
        }
      }
    }
  };

  return (
    <div style={{ height: '80%', width: '97.5%' }}>
      <Line data={chartData} options={chartOptions} />
    </div>
  );
};

export default ChartMod;
