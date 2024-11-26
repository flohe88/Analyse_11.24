import React from 'react';
import { BookingData } from '../../../types/booking';
import { Pie } from 'react-chartjs-2';

interface ApartmentDistributionChartProps {
  bookings: BookingData[];
}

export function ApartmentDistributionChart({ bookings }: ApartmentDistributionChartProps) {
  const apartmentDistribution = React.useMemo(() => {
    const apartmentCount = new Map<string, number>();
    
    bookings.forEach(booking => {
      const apartment = booking.apartment || 'Unbekannt';
      const currentCount = apartmentCount.get(apartment) || 0;
      apartmentCount.set(apartment, currentCount + 1);
    });

    const apartments = Array.from(apartmentCount.entries())
      .sort((a, b) => b[1] - a[1]); // Sortiere nach Häufigkeit

    const colors = [
      'rgb(75, 192, 192)',
      'rgb(255, 159, 64)',
      'rgb(255, 99, 132)',
      'rgb(54, 162, 235)',
      'rgb(255, 206, 86)',
      'rgb(153, 102, 255)'
    ];

    return {
      labels: apartments.map(([apartment]) => apartment),
      datasets: [{
        data: apartments.map(([_, count]) => count),
        backgroundColor: apartments.map((_, index) => colors[index % colors.length]),
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
    <Pie data={apartmentDistribution} options={options} />
  );
}
