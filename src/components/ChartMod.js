// ChartMod.jsx
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
import { format } from 'date-fns';       // ← import date‐fns

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
  isTimeAxis = false,
  tickFormat = (val) => format(new Date(val), 'yyyy-MM-dd'),
  multipleDatasets = [],
  isWeekMode = false
}) => {
  const datasets = [];
  
  // Add multiple datasets if provided
  if (multipleDatasets.length > 0) {
    multipleDatasets.forEach((dataset, index) => {
      const colors = ['#34B61F', '#2196F3', '#FF9800', '#9C27B0'];
      datasets.push({
        label: dataset.label,
        data: dataset.dataPoints,
        borderColor: dataset.borderColor || colors[index % colors.length],
        backgroundColor: dataset.backgroundColor || colors[index % colors.length] + '20',
        borderWidth: 1, // Very thin lines
        tension: 0.3,
        pointRadius: index === 0 ? 2 : 2, // Smaller green dots
        pointHoverRadius: index === 0 ? 4 : 3,
        pointStyle: index === 0 ? 'circle' : 'triangle', // Different point shapes
        fill: false,
        showLine: true // Ensure line is shown even with different point styles
      });
    });
  } else {
    // Default single dataset
    datasets.push({
      label: title,
      data: dataPoints,
      borderColor: '#34B61F',
      backgroundColor: '#B0E000',
      borderWidth: isWeekMode ? 1 : 2, // Thin lines for week mode
      tension: 0.3,
      pointRadius: isWeekMode ? 2 : 3, // Smaller points for week mode
      pointHoverRadius: isWeekMode ? 4 : 5
    });
  }
  
  // Add extra lines (reference lines)
  datasets.push(...extraLines.map(line => ({
    label: line.label,
    data: (multipleDatasets.length > 0 ? multipleDatasets[0].dataPoints : dataPoints).map(point => ({ x: point.x, y: Number(line.value) })),
    borderColor: line.color || 'red',
    backgroundColor: line.color || '#FF8282',
    borderWidth: line.borderWidth || 2,
    pointRadius: 0,
    tension: 0
  })));

  const chartData = {
    datasets
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          font: { size: 12, family: 'RobotoCondensed' }
        },
        // Minimal space above legend, significantly more space below for chart separation
        padding: { top: 5, bottom: 50, left: 0, right: 0 }
      },
      title: {
        display: true,
        text: title,
        font: { size: 16, family: 'RobotoCondensed' },
        align: 'left', // Align title to the left
        padding: { top: 0, bottom: 0 } // Remove space below title
      },
      tooltip: {
        titleFont: { size: 12, family: 'RobotoCondensed' },
        bodyFont: { size: 11, family: 'RobotoCondensed' }
      }
    },
    // Add spacing between legend and chart area
    layout: {
      padding: { top: 0, bottom: 0, left: 0, right: 0 }
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
            autoSkip: true,
            font: { size: isWeekMode ? 10 : 12, family: 'RobotoCondensed' }
          }
        }
      : {
          // range‐mode: use the passed-in labels[] array
          ticks: {
            autoSkip: true,
            maxTicksLimit: isWeekMode ? 7 : 20, // Exactly 7 ticks for week mode
            maxRotation: 0, // Keep labels horizontal
            minRotation: 0,
            font: { size: isWeekMode ? 10 : 12, family: 'RobotoCondensed' }, // Smaller font for week mode
            callback: (_tickValue, idx) => {
              // For week mode, we want to show 7 evenly distributed dates across the week
              if (isWeekMode && labels.length > 0) {
                // Get unique dates from all labels
                const uniqueDates = [...new Set(labels.map(label => label.split('T')[0]))].sort();
                
                // If we have 7 or more unique dates, pick every nth date to get 7
                if (uniqueDates.length >= 7) {
                  const step = Math.floor(uniqueDates.length / 7);
                  const dateIndex = Math.min(idx * step, uniqueDates.length - 1);
                  const dateOnly = uniqueDates[dateIndex];
                  
                  if (dateOnly) {
                    // Convert YYYY-MM-DD to DD/MM/YY format for week mode
                    const [year, month, day] = dateOnly.split('-');
                    const shortYear = year.slice(-2); // Get last 2 digits of year
                    return `${day}/${month}/${shortYear}`;
                  }
                } else {
                  // Fallback to original logic if we don't have enough unique dates
                  const totalLabels = labels.length;
                  const labelIndex = Math.floor((idx / 6) * (totalLabels - 1));
                  const raw = labels[labelIndex] || '';
                  const dateOnly = raw.split('T')[0];
                  
                  if (dateOnly) {
                    const [year, month, day] = dateOnly.split('-');
                    const shortYear = year.slice(-2);
                    return `${day}/${month}/${shortYear}`;
                  }
                }
              }
              
              // Fallback for range mode
              const raw = labels[idx] || '';
              const dateOnly = raw.split('T')[0];
              return dateOnly;
            },
            // Better handling of duplicate dates in week mode
            sampleSize: isWeekMode ? 7 : undefined
          },
          // Add 24h vertical lines for week mode
          grid: isWeekMode ? {
            color: 'rgba(0, 0, 0, 0.1)'
          } : {}
        },
      y: {
        title: {
          display: true,
          text: unit,
          font: { size: 12, family: 'RobotoCondensed' }
        },
        ticks: {
          font: { size: 12, family: 'RobotoCondensed' }
        }
      }
    },
    // Additional spacing configuration
    elements: {
      point: {
        hoverRadius: 6
      }
    },
    // Increase spacing between legend and chart
    spacing: 60
  };

  return (
    <div style={{ height: '80%', width: '97.5%', paddingTop: '10px' }}>
      <Line data={chartData} options={chartOptions} />
    </div>
  );
};

export default ChartMod;