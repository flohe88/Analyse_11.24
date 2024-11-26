import React from 'react';
import { BookingData } from '../../../types/booking';
import { Pie } from 'react-chartjs-2';

interface SourceDistributionChartProps {
  bookings: BookingData[];
}

export function SourceDistributionChart({ bookings }: SourceDistributionChartProps) {
  const sourceDistribution = React.useMemo(() => {
    const sourceCount = new Map<string, number>();
    
    bookings.forEach(booking => {
      const source = booking.bookingSource || 'Unbekannt';
      const currentCount = sourceCount.get(source) || 0;
      sourceCount.set(source, currentCount + 1);
    });

    const sources = Array.from(sourceCount.entries())
      .sort((a, b) => b[1] - a[1]); // Sortiere nach Häufigkeit

    const colors = [
      'rgb(255, 99, 132)',
      'rgb(54, 162, 235)',
      'rgb(255, 206, 86)',
      'rgb(75, 192, 192)',
      'rgb(153, 102, 255)',
      'rgb(255, 159, 64)'
    ];

    return {
      labels: sources.map(([source]) => source),
      datasets: [{
        data: sources.map(([_, count]) => count),
        backgroundColor: sources.map((_, index) => colors[index % colors.length]),
        borderWidth: 1
      }]
    };
  }, [bookings]);

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'right' as const,
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const label = context.label || '';
            const value = context.raw;
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
            const percentage = ((value * 100) / total).toFixed(1);
            return `${label}: ${value} (${percentage}%)`;
          }
        }
      }
    }
  };

  if (bookings.length === 0) {
    return <div className="text-center text-gray-500">Keine Daten verfügbar</div>;
  }

  return (
    <Pie data={sourceDistribution} options={options} />
  );
}
