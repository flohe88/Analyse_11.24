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
import { startOfMonth, format, isWithinInterval } from 'date-fns';
import { de } from 'date-fns/locale';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface CommissionsChartProps {
  bookings: BookingData[];
}

export function CommissionsChart({ bookings }: CommissionsChartProps) {
  const monthlyCommissions = React.useMemo(() => {
    if (!bookings || !Array.isArray(bookings)) return [];

    const monthlyData = new Map<string, number>();

    // Filter data within date range and group by month
    bookings.forEach((booking) => {
      if (!booking?.arrivalDate || !booking?.commission) return;

      try {
        const bookingDate = new Date(booking.arrivalDate);
        if (isNaN(bookingDate.getTime())) return;

        const monthKey = format(startOfMonth(bookingDate), 'yyyy-MM');
        const currentAmount = monthlyData.get(monthKey) || 0;
        monthlyData.set(monthKey, currentAmount + booking.commission);
      } catch (error) {
        console.warn('Fehler beim Verarbeiten des Datums:', booking.arrivalDate);
      }
    });

    // Convert to array and sort by date
    return Array.from(monthlyData.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, amount]) => ({
        date,
        amount
      }));
  }, [bookings]);

  const chartData = {
    labels: monthlyCommissions.map(item => 
      format(new Date(item.date), 'MMM yyyy', { locale: de })
    ),
    datasets: [
      {
        label: 'Provisionen',
        data: monthlyCommissions.map(item => item.amount),
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
            return new Intl.NumberFormat('de-DE', {
              style: 'currency',
              currency: 'EUR'
            }).format(context.raw);
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value: any) {
            return new Intl.NumberFormat('de-DE', {
              style: 'currency',
              currency: 'EUR',
              maximumFractionDigits: 0
            }).format(value);
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
