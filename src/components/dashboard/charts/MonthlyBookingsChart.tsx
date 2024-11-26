import React from 'react';
import { BookingData } from '../../../types/booking';
import { Line } from 'react-chartjs-2';
import { format, parseISO, startOfMonth } from 'date-fns';
import { de } from 'date-fns/locale';

interface MonthlyBookingsChartProps {
  bookings: BookingData[];
}

export function MonthlyBookingsChart({ bookings }: MonthlyBookingsChartProps) {
  const monthlyBookings = React.useMemo(() => {
    const bookingsByMonth = new Map<string, number>();
    
    bookings.forEach(booking => {
      const date = parseISO(booking.bookingDate);
      const monthKey = format(startOfMonth(date), 'yyyy-MM');
      const currentCount = bookingsByMonth.get(monthKey) || 0;
      bookingsByMonth.set(monthKey, currentCount + 1);
    });

    // Sortiere nach Datum
    const sortedEntries = Array.from(bookingsByMonth.entries())
      .sort((a, b) => a[0].localeCompare(b[0]));

    return {
      labels: sortedEntries.map(([month]) => 
        format(parseISO(month + '-01'), 'MMM yyyy', { locale: de })
      ),
      datasets: [{
        label: 'Anzahl Buchungen',
        data: sortedEntries.map(([_, count]) => count),
        borderColor: 'rgb(54, 162, 235)',
        tension: 0.1
      }]
    };
  }, [bookings]);

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1
        }
      }
    }
  };

  if (bookings.length === 0) {
    return <div className="text-center text-gray-500">Keine Daten verfügbar</div>;
  }

  return (
    <Line data={monthlyBookings} options={options} />
  );
}
