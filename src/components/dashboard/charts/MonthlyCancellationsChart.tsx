import React from 'react';
import { BookingData } from '../../../types/booking';
import { Line } from 'react-chartjs-2';
import { format, parseISO, startOfMonth } from 'date-fns';
import { de } from 'date-fns/locale';

interface MonthlyCancellationsChartProps {
  bookings: BookingData[];
}

export function MonthlyCancellationsChart({ bookings }: MonthlyCancellationsChartProps) {
  const monthlyCancellations = React.useMemo(() => {
    const cancellationsByMonth = new Map<string, number>();
    
    bookings.forEach(booking => {
      if (!booking.cancelled) return;
      
      const date = parseISO(booking.bookingDate);
      const monthKey = format(startOfMonth(date), 'yyyy-MM');
      const currentCount = cancellationsByMonth.get(monthKey) || 0;
      cancellationsByMonth.set(monthKey, currentCount + 1);
    });

    // Sortiere nach Datum
    const sortedEntries = Array.from(cancellationsByMonth.entries())
      .sort((a, b) => a[0].localeCompare(b[0]));

    return {
      labels: sortedEntries.map(([month]) => 
        format(parseISO(month + '-01'), 'MMM yyyy', { locale: de })
      ),
      datasets: [{
        label: 'Stornierungen',
        data: sortedEntries.map(([_, count]) => count),
        borderColor: 'rgb(255, 99, 132)',
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
    <Line data={monthlyCancellations} options={options} />
  );
}
