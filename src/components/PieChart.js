import React from 'react';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  Title
} from 'chart.js';
import { Pie } from 'react-chartjs-2';
import styles from './PieChart.module.css';
import logo from '../assets/images/bbbLogo.png';

ChartJS.register(ArcElement, Tooltip, Legend, Title);

const PieChart = ({ data = [], labels = [], options = {} }) => {

    const hasData = Array.isArray(data) && data.length > 0 && data.some(value => value !== 0);

    if (!hasData) {
        return (
            <div className= {styles.pieChartContainer}>
                <img src={logo} className= {styles.bbbLogo}/>
            </div>
        );
    }

    const chartData = {
        labels,
        datasets: [
        {
            data,
            backgroundColor: options.backgroundColor || [
            '#278817',
            '#323232',
            '#FFCE56',
            '#4BC0C0',
            '#9966FF',
            '#FF9F40'
            ],
            borderWidth: options.borderWidth || 1,
        }
        ]
    };

    const chartOptions = {
        responsive: true,
        plugins: {
        legend: {
            position: options.legendPosition || 'bottom',
        },
        title: {
            display: !!options.title,
            text: options.title,
        }
        }
    };

  return (
    <div className = {styles.pieChartContainer}>
      <Pie data={chartData} options={chartOptions}/>
    </div>
  );
};

export default PieChart;