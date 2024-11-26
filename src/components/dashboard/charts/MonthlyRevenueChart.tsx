import React from 'react';
import { BookingData } from '../../../types/booking';
import { Line } from 'react-chartjs-2';
import { format, parseISO, startOfMonth } from 'date-fns';
import { de } from 'date-fns/locale';

interface MonthlyRevenueChartProps {
  bookings: BookingData[];
}

export function MonthlyRevenueChart({ bookings }: MonthlyRevenueChartProps) {
  const monthlyRevenue = React.useMemo(() => {
    const revenueByMonth = new Map<string, number>();
    
    bookings.forEach(booking => {
      const date = parseISO(booking.bookingDate);
      const monthKey = format(startOfMonth(date), 'yyyy-MM');
      const currentRevenue = revenueByMonth.get(monthKey) || 0;
      revenueByMonth.set(monthKey, currentRevenue + (booking.revenue || 0));
    });

    // Sortiere nach Datum
    const sortedEntries = Array.from(revenueByMonth.entries())
      .sort((a, b) => a[0].localeCompare(b[0]));

    return {
      labels: sortedEntries.map(([month]) => 
        format(parseISO(month + '-01'), 'MMM yyyy', { locale: de })
      ),
      datasets: [{
        label: 'Monatlicher Umsatz',
        data: sortedEntries.map(([_, revenue]) => revenue),
        borderColor: 'rgb(75, 192, 192)',
        tension: 0.1
      }]
    };
  }, [bookings]);

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += new Intl.NumberFormat('de-DE', { 
                style: 'currency', 
                currency: 'EUR' 
              }).format(context.parsed.y);
            }
            return label;
          }
        }
      }
    },
    scales: {
      y: {
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

  if (bookings.length === 0) {
    return <div className="text-center text-gray-500">Keine Daten verfügbar</div>;
  }

  return (
    <Line data={monthlyRevenue} options={options} />
  );
}
