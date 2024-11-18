import React, { useMemo } from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { BookingData } from '../../../types/booking';
import { parseISO, getMonth } from 'date-fns';
import { de } from 'date-fns/locale';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface ArrivalMonthsChartProps {
  data: BookingData[];
  comparisonData?: BookingData[];
  isYearComparison?: boolean;
}

export function ArrivalMonthsChart({ data, comparisonData, isYearComparison }: ArrivalMonthsChartProps) {
  const monthNames = Array.from({ length: 12 }, (_, i) => 
    de.localize?.month(i, { width: 'abbreviated' }) ?? ''
  );

  const processDataForMonths = (bookings: BookingData[]) => {
    const monthCounts = new Array(12).fill(0);
    
    bookings.forEach(booking => {
      if (booking.arrivalDate) {
        const month = getMonth(parseISO(booking.arrivalDate));
        monthCounts[month]++;
      }
    });
    
    return monthCounts;
  };

  const chartData = useMemo(() => {
    const currentMonthData = processDataForMonths(data);
    const comparisonMonthData = comparisonData ? processDataForMonths(comparisonData) : null;

    const datasets = [
      {
        label: 'Anreisen',
        data: currentMonthData,
        backgroundColor: 'rgba(59, 130, 246, 0.5)', // blue-500 with opacity
        borderColor: 'rgb(59, 130, 246)',
        borderWidth: 1,
        borderRadius: 5,
      }
    ];

    if (isYearComparison && comparisonMonthData) {
      datasets.push({
        label: 'Vorjahr',
        data: comparisonMonthData,
        backgroundColor: 'rgba(156, 163, 175, 0.5)', // gray-400 with opacity
        borderColor: 'rgb(156, 163, 175)',
        borderWidth: 1,
        borderRadius: 5,
      });
    }

    return {
      labels: monthNames,
      datasets,
    };
  }, [data, comparisonData, isYearComparison]);

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            return `${context.dataset.label}: ${context.formattedValue} Buchungen`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          precision: 0
        }
      }
    }
  };

  return (
    <div className="w-full h-[400px]">
      <Bar options={options} data={chartData} />
    </div>
  );
}
