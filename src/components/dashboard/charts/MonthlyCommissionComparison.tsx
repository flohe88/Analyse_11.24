import React, { useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { BookingData } from '../../../types/booking';
import { parseISO, format, getMonth } from 'date-fns';
import { de } from 'date-fns/locale';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface MonthlyCommissionComparisonProps {
  data: BookingData[];
  comparisonData: BookingData[];
  filterType: 'arrival' | 'booking';
}

export const MonthlyCommissionComparison: React.FC<MonthlyCommissionComparisonProps> = ({
  data,
  comparisonData,
  filterType,
}) => {
  const monthNames = Array.from({ length: 12 }, (_, i) =>
    format(new Date(2024, i, 1), 'MMM', { locale: de })
  );

  const calculateMonthlyCommissions = (bookings: BookingData[]) => {
    if (!bookings || !Array.isArray(bookings)) return new Array(12).fill(0);
    
    const monthlyCommissions = new Array(12).fill(0);

    bookings.forEach((booking) => {
      if (!booking) return;
      
      const date = booking[filterType === 'arrival' ? 'arrivalDate' : 'bookingDate'];
      if (date && booking.commission) {
        try {
          const month = getMonth(parseISO(date));
          if (month >= 0 && month < 12) {
            monthlyCommissions[month] += booking.commission;
          }
        } catch (error) {
          console.warn('Fehler beim Verarbeiten des Datums:', date);
        }
      }
    });

    return monthlyCommissions;
  };

  const chartData = useMemo(() => {
    const currentYearCommissions = calculateMonthlyCommissions(data);
    const previousYearCommissions = calculateMonthlyCommissions(comparisonData);

    return {
      labels: monthNames,
      datasets: [
        {
          label: 'Aktuelles Jahr',
          data: currentYearCommissions,
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          fill: true,
          tension: 0.4,
          borderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6,
          pointBackgroundColor: 'rgb(59, 130, 246)',
          pointHoverBackgroundColor: 'rgb(59, 130, 246)',
          pointBorderColor: 'white',
          pointHoverBorderColor: 'white',
          pointBorderWidth: 2,
          pointHoverBorderWidth: 2,
        },
        ...(Array.isArray(comparisonData) && comparisonData.length > 0 ? [{
          label: 'Vorjahr',
          data: previousYearCommissions,
          borderColor: 'rgb(107, 114, 128)',
          backgroundColor: 'rgba(107, 114, 128, 0.1)',
          fill: true,
          tension: 0.4,
          borderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6,
          pointBackgroundColor: 'rgb(107, 114, 128)',
          pointHoverBackgroundColor: 'rgb(107, 114, 128)',
          pointBorderColor: 'white',
          pointHoverBorderColor: 'white',
          pointBorderWidth: 2,
          pointHoverBorderWidth: 2,
        }] : []),
      ],
    };
  }, [data, comparisonData, filterType]);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      intersect: false,
      mode: 'index' as const,
    },
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          usePointStyle: true,
          padding: 20,
          font: {
            family: "'Inter', sans-serif",
            size: 12,
          },
        },
      },
      tooltip: {
        backgroundColor: 'white',
        titleColor: 'rgb(17, 24, 39)',
        bodyColor: 'rgb(17, 24, 39)',
        bodyFont: {
          family: "'Inter', sans-serif",
        },
        titleFont: {
          family: "'Inter', sans-serif",
          weight: 'bold',
        },
        padding: 12,
        borderColor: 'rgb(229, 231, 235)',
        borderWidth: 1,
        displayColors: true,
        usePointStyle: true,
        callbacks: {
          label: function(context: any) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += new Intl.NumberFormat('de-DE', {
                style: 'currency',
                currency: 'EUR',
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              }).format(context.parsed.y);
            }
            return label;
          },
        },
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          font: {
            family: "'Inter', sans-serif",
            size: 12,
          },
        },
      },
      y: {
        grid: {
          color: 'rgb(243, 244, 246)',
        },
        ticks: {
          font: {
            family: "'Inter', sans-serif",
            size: 12,
          },
          callback: function(value: any) {
            return new Intl.NumberFormat('de-DE', {
              style: 'currency',
              currency: 'EUR',
              minimumFractionDigits: 0,
              maximumFractionDigits: 0,
            }).format(value);
          },
        },
      },
    },
  };

  return (
    <div className="h-[400px]">
      <Line data={chartData} options={options} />
    </div>
  );
};
