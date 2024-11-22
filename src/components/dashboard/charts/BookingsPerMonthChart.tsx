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

interface BookingsPerMonthChartProps {
  data: BookingData[];
  comparisonData?: BookingData[];
  isYearComparison?: boolean;
}

export function BookingsPerMonthChart({ data, comparisonData, isYearComparison }: BookingsPerMonthChartProps) {
  const monthNames = Array.from({ length: 12 }, (_, i) => 
    de.localize?.month(i, { width: 'abbreviated' }) ?? ''
  );

  // Funktion zum Zählen der Buchungen pro Monat
  const countBookingsPerMonth = (bookings: BookingData[]) => {
    const monthCounts = new Array(12).fill(0);
    
    bookings.forEach(booking => {
      if (booking.bookingDate) {
        const month = getMonth(parseISO(booking.bookingDate));
        monthCounts[month]++;
      }
    });
    
    return monthCounts;
  };

  const chartData = useMemo(() => {
    if (!isYearComparison) {
      // Wenn kein Jahresvergleich aktiv ist, zeige nur das aktuelle Jahr
      const currentYearBookings = countBookingsPerMonth(data);
      return {
        labels: monthNames,
        datasets: [
          {
            label: 'Buchungen',
            data: currentYearBookings,
            backgroundColor: 'rgba(59, 130, 246, 0.8)',
            borderColor: 'rgb(59, 130, 246)',
            borderWidth: 1,
            borderRadius: 5
          }
        ]
      };
    }

    // Wenn Jahresvergleich aktiv ist
    if (!comparisonData) {
      return {
        labels: monthNames,
        datasets: []
      };
    }

    // Zähle Buchungen für beide Jahre
    const currentYearBookings = countBookingsPerMonth(data);
    const comparisonYearBookings = countBookingsPerMonth(comparisonData);

    // Erstelle Datensätze für beide Jahre
    return {
      labels: monthNames,
      datasets: [
        {
          label: 'Aktuelles Jahr',
          data: currentYearBookings,
          backgroundColor: 'rgba(59, 130, 246, 0.8)',
          borderColor: 'rgb(59, 130, 246)',
          borderWidth: 1,
          borderRadius: 5,
          stack: 'Stack 0' // Separate Stacks für die Gruppierung
        },
        {
          label: 'Vergleichsjahr',
          data: comparisonYearBookings,
          backgroundColor: 'rgba(156, 163, 175, 0.6)',
          borderColor: 'rgb(156, 163, 175)',
          borderWidth: 1,
          borderRadius: 5,
          stack: 'Stack 1' // Separate Stacks für die Gruppierung
        }
      ]
    };
  }, [data, comparisonData, isYearComparison, monthNames]);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          usePointStyle: true,
          pointStyle: 'circle'
        }
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            const label = context.dataset.label || '';
            const value = context.parsed.y;
            return `${label}: ${value} ${value === 1 ? 'Buchung' : 'Buchungen'}`;
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          display: false
        }
      },
      y: {
        beginAtZero: true,
        ticks: {
          precision: 0,
          callback: (value: number) => {
            return value === 0 ? '0' : `${value} ${value === 1 ? 'Buchung' : 'Buchungen'}`;
          }
        }
      }
    },
    // Diese Optionen steuern die Darstellung der Balken
    barPercentage: 0.9,    // Breite der Balkengruppe im Verhältnis zum verfügbaren Platz
    categoryPercentage: 0.8, // Breite der einzelnen Balken innerhalb der Gruppe
    interaction: {
      intersect: false,
      mode: 'index'
    }
  };

  return (
    <div className="w-full h-[400px] flex items-center justify-center">
      <div className="w-full h-full">
        <Bar 
          options={options} 
          data={chartData}
        />
      </div>
    </div>
  );
}
