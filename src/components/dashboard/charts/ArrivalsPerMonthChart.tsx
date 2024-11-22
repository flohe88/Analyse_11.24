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

interface ArrivalsPerMonthChartProps {
  data: BookingData[];
  comparisonData?: BookingData[];
  isYearComparison?: boolean;
}

export function ArrivalsPerMonthChart({ data, comparisonData, isYearComparison }: ArrivalsPerMonthChartProps) {
  const monthNames = Array.from({ length: 12 }, (_, i) => 
    de.localize?.month(i, { width: 'abbreviated' }) ?? ''
  );

  // Funktion zum Zählen der Anreisen pro Monat
  const countArrivalsPerMonth = (bookings: BookingData[]) => {
    const monthCounts = new Array(12).fill(0);
    
    bookings.forEach(booking => {
      if (booking.arrivalDate) {
        const month = getMonth(parseISO(booking.arrivalDate));
        monthCounts[month]++;
      }
    });
    
    return monthCounts;
  };

  const chartData = useMemo(() => {
    if (!isYearComparison) {
      // Wenn kein Jahresvergleich aktiv ist, zeige nur das aktuelle Jahr
      const currentYearArrivals = countArrivalsPerMonth(data);
      return {
        labels: monthNames,
        datasets: [
          {
            label: 'Anreisen',
            data: currentYearArrivals,
            backgroundColor: 'rgba(34, 197, 94, 0.8)', // Grün für Anreisen
            borderColor: 'rgb(34, 197, 94)',
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

    // Zähle Anreisen für beide Jahre
    const currentYearArrivals = countArrivalsPerMonth(data);
    const comparisonYearArrivals = countArrivalsPerMonth(comparisonData);

    // Erstelle Datensätze für beide Jahre
    return {
      labels: monthNames,
      datasets: [
        {
          label: 'Aktuelles Jahr',
          data: currentYearArrivals,
          backgroundColor: 'rgba(34, 197, 94, 0.8)', // Grün für aktuelles Jahr
          borderColor: 'rgb(34, 197, 94)',
          borderWidth: 1,
          borderRadius: 5,
          stack: 'Stack 0' // Separate Stacks für die Gruppierung
        },
        {
          label: 'Vergleichsjahr',
          data: comparisonYearArrivals,
          backgroundColor: 'rgba(156, 163, 175, 0.6)', // Grau für Vergleichsjahr
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
            return `${label}: ${value} ${value === 1 ? 'Anreise' : 'Anreisen'}`;
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
            return value === 0 ? '0' : `${value} ${value === 1 ? 'Anreise' : 'Anreisen'}`;
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
