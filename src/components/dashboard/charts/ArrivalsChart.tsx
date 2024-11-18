import React from 'react';
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
import { startOfMonth, format } from 'date-fns';
import { de } from 'date-fns/locale';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface ArrivalsChartProps {
  bookings: BookingData[];
}

export function ArrivalsChart({ bookings }: ArrivalsChartProps) {
  const monthlyArrivals = React.useMemo(() => {
    if (!bookings || !Array.isArray(bookings)) return [];

    const monthlyData = new Map<string, number>();

    bookings.forEach((booking) => {
      if (!booking?.arrivalDate) return;

      try {
        const arrivalDate = new Date(booking.arrivalDate);
        if (isNaN(arrivalDate.getTime())) return;

        const monthKey = format(startOfMonth(arrivalDate), 'yyyy-MM');
        const currentCount = monthlyData.get(monthKey) || 0;
        monthlyData.set(monthKey, currentCount + 1);
      } catch (error) {
        console.warn('Fehler beim Verarbeiten des Datums:', booking.arrivalDate);
      }
    });

    return Array.from(monthlyData.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, count]) => ({
        date,
        count
      }));
  }, [bookings]);

  const chartData = {
    labels: monthlyArrivals.map(item => 
      format(new Date(item.date), 'MMM yyyy', { locale: de })
    ),
    datasets: [
      {
        label: 'Ankünfte',
        data: monthlyArrivals.map(item => item.count),
        backgroundColor: 'rgba(59, 130, 246, 0.5)',
        borderColor: 'rgb(59, 130, 246)',
        borderWidth: 1,
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const count = context.raw;
            return `${count} ${count === 1 ? 'Ankunft' : 'Ankünfte'}`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
          callback: function(value: any) {
            return value.toFixed(0);
          }
        }
      }
    }
  };

  return (
    <div className="h-[400px]">
      <Bar data={chartData} options={options} />
    </div>
  );
}
