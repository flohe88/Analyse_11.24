import React from 'react';
import { BookingData } from '../../../types/booking';
import { Line } from 'react-chartjs-2';
import { format, parseISO, startOfMonth } from 'date-fns';
import { de } from 'date-fns/locale';

interface MonthlyNightsChartProps {
  bookings: BookingData[];
}

export function MonthlyNightsChart({ bookings }: MonthlyNightsChartProps) {
  const monthlyNights = React.useMemo(() => {
    const nightsByMonth = new Map<string, number>();
    
    bookings.forEach(booking => {
      const date = parseISO(booking.bookingDate);
      const monthKey = format(startOfMonth(date), 'yyyy-MM');
      const currentNights = nightsByMonth.get(monthKey) || 0;
      nightsByMonth.set(monthKey, currentNights + (booking.nights || 0));
    });

    // Sortiere nach Datum
    const sortedEntries = Array.from(nightsByMonth.entries())
      .sort((a, b) => a[0].localeCompare(b[0]));

    return {
      labels: sortedEntries.map(([month]) => 
        format(parseISO(month + '-01'), 'MMM yyyy', { locale: de })
      ),
      datasets: [{
        label: 'Übernachtungen',
        data: sortedEntries.map(([_, nights]) => nights),
        borderColor: 'rgb(153, 102, 255)',
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
    <Line data={monthlyNights} options={options} />
  );
}
